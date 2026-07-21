import type { Context, Middleware } from "koa";
import { failure } from "../lib/response";
import { connectRedis } from "../lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  keyGenerator: (ctx: Context) => string | Promise<string>;
}

const slidingWindowScript = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfter = window

  if oldest[2] then
    retryAfter = math.max(0, window - (now - tonumber(oldest[2])))
  end

  redis.call('PEXPIRE', key, window)
  return {0, count, retryAfter}
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return {1, count + 1, 0}
`;

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return Number.NaN;
}

function parseRateLimitResult(result: unknown, limit: number): RateLimitResult {
  if (!Array.isArray(result) || result.length < 3) {
    throw new Error("Invalid Redis rate-limit result");
  }

  const allowed = toNumber(result[0]) === 1;
  const count = toNumber(result[1]);
  const retryAfterMs = toNumber(result[2]);

  if (!Number.isFinite(count) || !Number.isFinite(retryAfterMs)) {
    throw new Error("Invalid Redis rate-limit result values");
  }

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterMs,
  };
}

export function getClientIp(ctx: Context): string {
  return ctx.ip || ctx.request.ip || "unknown";
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = await connectRedis();
  const now = Date.now();
  const member = `${now}:${crypto.randomUUID()}`;
  const result = await redis.eval(slidingWindowScript, 1, key, now, windowMs, limit, member);

  return parseRateLimitResult(result, limit);
}

export function rateLimit(options: RateLimitOptions): Middleware {
  return async (ctx, next) => {
    const keyPart = await options.keyGenerator(ctx);
    const result = await checkRateLimit(
      `${options.keyPrefix}:${keyPart}`,
      options.limit,
      options.windowMs
    );

    ctx.set("X-RateLimit-Limit", String(result.limit));
    ctx.set("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
      ctx.status = 429;
      ctx.set("Retry-After", String(retryAfterSeconds));
      ctx.body = failure("RATE_LIMITED", "Too many requests");
      return;
    }

    await next();
  };
}
