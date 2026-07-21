import { beforeEach, describe, expect, it } from "vitest";
import { resetRedisForTests } from "./redis";
import { blacklistToken, isTokenBlacklisted } from "./token-blacklist";

describe("token blacklist", () => {
  beforeEach(() => {
    resetRedisForTests();
  });

  it("marks jti as blacklisted until exp", async () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    expect(await isTokenBlacklisted("jti-1")).toBe(false);
    await blacklistToken("jti-1", exp);
    expect(await isTokenBlacklisted("jti-1")).toBe(true);
  });

  it("ignores already-expired tokens", async () => {
    await blacklistToken("jti-expired", Math.floor(Date.now() / 1000) - 10);
    expect(await isTokenBlacklisted("jti-expired")).toBe(false);
  });
});
