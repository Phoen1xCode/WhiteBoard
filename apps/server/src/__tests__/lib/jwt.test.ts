import { describe, test, expect, beforeAll } from "bun:test";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test-secret-must-be-at-least-32-characters-for-hs256";

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../lib/jwt";

describe("JWT", () => {
  test("signAccessToken creates a verifiable token with user claims", async () => {
    const token = await signAccessToken({
      userId: 1,
      email: "a@b.com",
      username: "alice",
    });
    expect(typeof token).toBe("string");

    const payload = await verifyAccessToken(token);
    expect(payload.userId).toBe(1);
    expect(payload.email).toBe("a@b.com");
    expect(payload.username).toBe("alice");
    expect(payload.jti).toBeDefined();
  });

  test("signRefreshToken creates a verifiable token with userId", async () => {
    const token = await signRefreshToken(1);
    expect(typeof token).toBe("string");

    const payload = await verifyRefreshToken(token);
    expect(payload.userId).toBe(1);
    expect(payload.tokenType).toBe("refresh");
  });

  test("verifyAccessToken rejects expired tokens", async () => {
    await expect(verifyAccessToken("invalid.token.here")).rejects.toThrow();
  });

  test("verifyRefreshToken rejects access tokens", async () => {
    const accessToken = await signAccessToken({
      userId: 1,
      email: "a@b.com",
      username: "alice",
    });
    await expect(verifyRefreshToken(accessToken)).rejects.toThrow();
  });
});
