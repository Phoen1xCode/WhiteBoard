import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppBindings } from "@/lib/hono";

import { checkRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enforces a sliding window and reports when the key is available again", async () => {
    const key = `test:${expect.getState().currentTestName}`;

    expect(await checkRateLimit(key, 2, 1_000)).toEqual({
      allowed: true,
      limit: 2,
      remaining: 1,
      retryAfterMs: 0,
    });
    expect((await checkRateLimit(key, 2, 1_000)).remaining).toBe(0);

    vi.advanceTimersByTime(250);
    expect(await checkRateLimit(key, 2, 1_000)).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterMs: 750,
    });

    vi.advanceTimersByTime(751);
    expect(await checkRateLimit(key, 2, 1_000)).toMatchObject({
      allowed: true,
      remaining: 1,
    });
  });

  it("uses the first forwarded address and falls back to unknown", async () => {
    const app = new Hono<AppBindings>();
    app.get("/ip", (c) => c.text(getClientIp(c)));

    const forwarded = await app.request("/ip", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    const missing = await app.request("/ip");

    expect(await forwarded.text()).toBe("203.0.113.10");
    expect(await missing.text()).toBe("unknown");
  });

  it("returns stable HTTP headers and error body after the limit is reached", async () => {
    const app = new Hono<AppBindings>();
    app.use(
      "/limited",
      rateLimit({
        keyPrefix: `http:${expect.getState().currentTestName}`,
        limit: 1,
        windowMs: 1_500,
        keyGenerator: () => "user-1",
      }),
    );
    app.get("/limited", (c) => c.json({ ok: true }));

    const allowed = await app.request("/limited");
    vi.advanceTimersByTime(1);
    const rejected = await app.request("/limited");

    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("X-RateLimit-Limit")).toBe("1");
    expect(allowed.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(rejected.status).toBe(429);
    expect(rejected.headers.get("Retry-After")).toBe("2");
    expect(await rejected.json()).toEqual({
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
  });
});
