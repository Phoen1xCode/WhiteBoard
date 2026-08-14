import type { Context, MiddlewareHandler } from "hono";

import type { AppBindings } from "@/lib/hono";

import { errorBody } from "@/lib/errors";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
}

interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  keyGenerator: (c: Context<AppBindings>) => string | Promise<string>;
}

/** In-process sliding window. Single-instance only. */
const windows = new Map<string, number[]>();

export function getClientIp(c: Context<AppBindings>): string {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((time) => time > cutoff);

  if (hits.length >= limit) {
    windows.set(key, hits);
    const oldest = hits[0] ?? now;
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - oldest)),
    };
  }

  hits.push(now);
  windows.set(key, hits);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - hits.length),
    retryAfterMs: 0,
  };
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const keyPart = await options.keyGenerator(c);
    const result = await checkRateLimit(
      `${options.keyPrefix}:${keyPart}`,
      options.limit,
      options.windowMs,
    );

    c.header("X-RateLimit-Limit", String(result.limit));
    c.header("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      c.header("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      return c.json(errorBody("RATE_LIMITED", "Too many requests"), 429);
    }

    await next();
  };
}
