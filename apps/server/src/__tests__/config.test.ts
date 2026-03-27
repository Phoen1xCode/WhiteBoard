import { describe, test, expect } from "bun:test";

describe("config", () => {
  test("loads required env vars and applies defaults", async () => {
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";

    delete process.env.PORT;
    delete process.env.JWT_ACCESS_TTL_MINUTES;
    delete process.env.JWT_REFRESH_TTL_DAYS;
    delete process.env.CORS_ORIGIN;
    delete process.env.COMPACTION_THRESHOLD;
    delete process.env.COMPACTION_INTERVAL_SECONDS;
    delete process.env.WS_MAX_PAYLOAD_BYTES;

    const { config } = await import("../config/index");

    expect(config.DATABASE_URL).toBe(
      "postgresql://test:test@localhost:5432/test",
    );
    expect(config.REDIS_URL).toBe("redis://localhost:6379");
    expect(config.JWT_SECRET).toBe("test-secret-at-least-32-characters-long");
    expect(config.PORT).toBe(3000);
    expect(config.JWT_ACCESS_TTL_MINUTES).toBe(15);
    expect(config.JWT_REFRESH_TTL_DAYS).toBe(7);
    expect(config.CORS_ORIGIN).toBe("*");
    expect(config.COMPACTION_THRESHOLD).toBe(100);
    expect(config.COMPACTION_INTERVAL_SECONDS).toBe(30);
    expect(config.WS_MAX_PAYLOAD_BYTES).toBe(65536);
  });

  test("throws if required env var is missing", async () => {
    delete process.env.JWT_SECRET;
    const { loadConfig } = await import("../config/index");
    expect(() => loadConfig()).toThrow("JWT_SECRET");
  });
});
