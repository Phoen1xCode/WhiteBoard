import { describe, test, expect, mock } from "bun:test";

// Mock Redis pipeline — must be before any import that uses lib/redis
// ioredis pipeline().exec() returns [[err, result], ...] format
const mockPipelineUnderLimit = {
  zremrangebyscore: function () {
    return this;
  },
  zadd: function () {
    return this;
  },
  zcount: function () {
    return this;
  },
  expire: function () {
    return this;
  },
  exec: mock(() =>
    Promise.resolve([[null, 0], [null, 1], [null, 1], [null, 1]]),
  ),
};

const mockPipelineOverLimit = {
  zremrangebyscore: function () {
    return this;
  },
  zadd: function () {
    return this;
  },
  zcount: function () {
    return this;
  },
  expire: function () {
    return this;
  },
  exec: mock(() =>
    // count = 101, max = 100 → over limit
    Promise.resolve([[null, 0], [null, 1], [null, 101], [null, 1]]),
  ),
};

let currentPipeline = mockPipelineUnderLimit;

mock.module("../../lib/redis", () => ({
  getRedis: () => ({
    pipeline: () => currentPipeline,
  }),
  initRedis: mock(),
  getRedisSub: mock(),
  closeRedis: mock(),
}));

import { Elysia } from "elysia";
import { rateLimitPlugin } from "../../plugins/rate-limit.plugin";

const app = new Elysia().use(rateLimitPlugin).get("/test", () => "ok");

describe("rate-limit.plugin", () => {
  test("allows request when under limit", async () => {
    currentPipeline = mockPipelineUnderLimit;
    const res = await app.handle(
      new Request("http://localhost/test", {
        headers: { "X-Forwarded-For": "1.2.3.4" },
      }),
    );
    expect(res.status).toBe(200);
  });

  test("blocks request with 429 when over limit", async () => {
    currentPipeline = mockPipelineOverLimit;
    const res = await app.handle(
      new Request("http://localhost/test", {
        headers: { "X-Forwarded-For": "1.2.3.4" },
      }),
    );
    expect(res.status).toBe(429);
  });

  test("allows request with no IP header (uses unknown fallback)", async () => {
    currentPipeline = mockPipelineUnderLimit;
    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
  });
});
