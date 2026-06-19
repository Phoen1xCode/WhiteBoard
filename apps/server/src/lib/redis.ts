import "dotenv/config";
import Redis from "ioredis";

let redisClient: Redis | null = null;

function getRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not set");
  }

  return redisUrl;
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(getRedisUrl(), {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    redisClient.on("error", (error) => {
      console.error("Redis connection error:", error.message);
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<Redis> {
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
