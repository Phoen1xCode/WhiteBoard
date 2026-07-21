import "dotenv/config";
import Redis from "ioredis";

/** Minimal Redis surface used by blacklist + rate-limit. */
export interface RedisLike {
  status: string;
  connect(): Promise<void>;
  quit(): Promise<string>;
  disconnect(): void;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<"OK" | null>;
  exists(...keys: string[]): Promise<number>;
  eval(
    script: string,
    numKeys: number,
    ...args: (string | number)[]
  ): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): unknown;
}

let redisClient: RedisLike | null = null;

class MemoryRedis implements RedisLike {
  status = "ready";
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private zsets = new Map<string, Map<string, number>>();

  async connect(): Promise<void> {
    this.status = "ready";
  }

  async quit(): Promise<string> {
    this.status = "end";
    return "OK";
  }

  disconnect(): void {
    this.status = "end";
  }

  private purge(key: string): void {
    const entry = this.store.get(key);
    if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
    }
  }

  async set(
    key: string,
    value: string,
    mode?: string,
    ttl?: number
  ): Promise<"OK" | null> {
    const expiresAt =
      mode === "EX" && typeof ttl === "number" ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      this.purge(key);
      if (this.store.has(key)) count += 1;
    }
    return count;
  }

  async eval(
    script: string,
    _numKeys: number,
    ...args: (string | number)[]
  ): Promise<unknown> {
    // Only the sliding-window rate-limit script is supported in memory mode.
    if (!script.includes("ZREMRANGEBYSCORE")) {
      throw new Error("Unsupported eval script in memory redis");
    }

    const key = String(args[0]);
    const now = Number(args[1]);
    const window = Number(args[2]);
    const limit = Number(args[3]);
    const member = String(args[4]);

    let zset = this.zsets.get(key);
    if (!zset) {
      zset = new Map();
      this.zsets.set(key, zset);
    }

    for (const [m, score] of [...zset.entries()]) {
      if (score <= now - window) zset.delete(m);
    }

    const count = zset.size;
    if (count >= limit) {
      let oldest = now;
      for (const score of zset.values()) {
        oldest = Math.min(oldest, score);
      }
      const retryAfter = Math.max(0, window - (now - oldest));
      return [0, count, retryAfter];
    }

    zset.set(member, now);
    return [1, count + 1, 0];
  }
}

function getRedisUrl(): string {
  return process.env.REDIS_URL ?? "memory://";
}

export function getRedis(): RedisLike {
  if (!redisClient) {
    const url = getRedisUrl();

    if (url.startsWith("memory")) {
      redisClient = new MemoryRedis();
      return redisClient;
    }

    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    client.on("error", (error) => {
      console.error("Redis connection error:", error.message);
    });

    redisClient = client as unknown as RedisLike;
  }

  return redisClient;
}

export async function connectRedis(): Promise<RedisLike> {
  const client = getRedis();

  if (client.status === "ready") {
    return client;
  }

  if (["wait", "close", "end"].includes(client.status)) {
    await client.connect();
  }

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (!redisClient) {
    return;
  }

  if (redisClient.status === "ready") {
    await redisClient.quit();
  } else {
    redisClient.disconnect();
  }

  redisClient = null;
}

/** Test helper: force a fresh memory redis. */
export function resetRedisForTests(): void {
  redisClient = null;
  process.env.REDIS_URL = "memory://";
}
