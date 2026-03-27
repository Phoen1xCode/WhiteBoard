import { describe, test, expect, mock } from "bun:test";

// Mock ioredis pipeline — ioredis pipeline().exec() returns [[null, result], ...] format
const mockRedis = {
  pipeline: mock(() => {
    const pipe = {
      zremrangebyscore: (..._args: any[]) => pipe,
      zadd: (..._args: any[]) => pipe,
      zcount: (..._args: any[]) => pipe,
      expire: (..._args: any[]) => pipe,
      exec: mock(() => Promise.resolve([[null, 0], [null, 1], [null, 1], [null, 1]])),
    };
    return pipe;
  }),
};

mock.module("../../lib/redis", () => ({
  getRedis: () => mockRedis,
}));

import { createRateLimiter } from "../../middleware/rate-limit";

describe("rate-limit", () => {
  test("creates a rate limiter function", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
    expect(typeof limiter).toBe("function");
  });

  test("returns null (allow) when under limit", async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
    const req = new Request("http://localhost/api/test", {
      headers: { "X-Forwarded-For": "1.2.3.4" },
    });
    const result = await limiter(req);
    expect(result).toBeNull();
  });
});
