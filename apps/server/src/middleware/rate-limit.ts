import { getRedis } from "../lib/redis";
import { jsonError } from "../lib/response";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests allowed within the time window
}

function getIp(req: Request): string {
  return req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown";
}

export function createRateLimiter(options: RateLimitOptions) {
  return async function rateLimit(req: Request): Promise<Response | null> {
    const redis = getRedis();
    const ip = getIp(req);
    const path = new URL(req.url).pathname;
    const key = `ratelimit:${ip}:${path}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    try {
      // ioredis pipeline: each result is [error, value]
      const results = await redis
        .pipeline()
        .zremrangebyscore(key, "-inf", String(windowStart))
        .zadd(key, String(now), `${now}:${Math.random()}`)
        .zcount(key, "-inf", "+inf")
        .expire(key, Math.ceil(options.windowMs / 1000) + 1)
        .exec();

      // results[2] is the zcount result: [null, count]
      const count = results?.[2]?.[1] ?? 0;
      if ((count as number) > options.max) {
        return jsonError(429, "Too many requests");
      }
    } catch {
      // Fail open — allow request if Redis is unavailable
    }

    return null; // Allow
  };
}
