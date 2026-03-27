import Redis from "ioredis";
import { config } from "../config";

// Primary client: standard Redis commands (GET, SET, INCR, RPUSH, pipeline, etc.)
let redis: Redis;

// Pub/Sub subscriber: dedicated connection (subscriber mode locks the connection)
let redisSub: Redis;

export function initRedis(): { redis: Redis; redisSub: Redis } {
  redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      return Math.min(times * 200, 2000);
    },
  });

  redisSub = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      return Math.min(times * 200, 2000);
    },
  });

  redis.on("error", (err) => console.error("Redis error:", err.message));
  redisSub.on("error", (err) => console.error("Redis error:", err.message));

  return { redis, redisSub };
}

export function getRedis(): Redis {
  if (!redis)
    throw new Error("Redis client not initialized. Call initRedis() first.");
  return redis;
}

export function getRedisSub(): Redis {
  if (!redisSub)
    throw new Error(
      "Redis subscriber not initialized. Call initRedis() first.",
    );
  return redisSub;
}

export async function closeRedis(): Promise<void> {
  if (redisSub) {
    redisSub.disconnect();
  }
  if (redis) {
    redis.disconnect();
  }
}
