import type { Context, Middleware } from "koa";

import { failure } from "@/lib/response";

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

/** In-process sliding window. Single-instance only. */
const windows = new Map<string, number[]>();

export function getClientIp(ctx: Context): string {
  return ctx.ip || ctx.request.ip || "unknown";
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);

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

export function rateLimit(options: RateLimitOptions): Middleware {
  return async (ctx, next) => {
    const keyPart = await options.keyGenerator(ctx);
    const result = await checkRateLimit(
      `${options.keyPrefix}:${keyPart}`,
      options.limit,
      options.windowMs,
    );

    ctx.set("X-RateLimit-Limit", String(result.limit));
    ctx.set("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      ctx.status = 429;
      ctx.set("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      ctx.body = failure("RATE_LIMITED", "Too many requests");
      return;
    }

    await next();
  };
}
