import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  signTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

describe("jwt", () => {
  it("signs and verifies access/refresh tokens", () => {
    const pair = signTokenPair("user-1");
    const access = verifyAccessToken(pair.accessToken);
    const refresh = verifyRefreshToken(pair.refreshToken);

    expect(access.sub).toBe("user-1");
    expect(access.type).toBe("access");
    expect(access.jti).toBeTruthy();
    expect(refresh.sub).toBe("user-1");
    expect(refresh.type).toBe("refresh");
  });

  it("rejects wrong token type", () => {
    const refresh = signRefreshToken({ subject: "u", jti: crypto.randomUUID() });
    expect(() => verifyAccessToken(refresh)).toThrow();
  });

  it("includes distinct jti values", () => {
    const a = signAccessToken({ subject: "u", jti: "jti-a" });
    const b = signAccessToken({ subject: "u", jti: "jti-b" });
    expect(verifyAccessToken(a).jti).toBe("jti-a");
    expect(verifyAccessToken(b).jti).toBe("jti-b");
  });
});
