import { describe, test, expect, mock, spyOn, beforeAll, afterAll } from "bun:test";

// mock.module for auth.service must come before importing any module that
// transitively depends on it. authPlugin imports auth.service at load time.
mock.module("../../services/auth.service", () => ({
  isTokenBlacklisted: mock(async (jti: string) => jti === "blacklisted-jti"),
  register: mock(),
  login: mock(),
  refreshTokens: mock(),
  logout: mock(),
  getMe: mock(),
  AuthError: class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import * as jwtModule from "../../lib/jwt";

// Test app: protected route that echoes back the user context.
const app = new Elysia()
  .use(authPlugin)
  .get("/protected", ({ user }) => user, { auth: true })
  .get("/public", () => "ok");

// Use spyOn instead of mock.module for lib/jwt so that the real module is not
// overwritten in the global registry — preventing leakage into jwt.test.ts.
// spyOn patches the module namespace object; mock.restore() in afterAll
// restores the original implementation.
beforeAll(() => {
  spyOn(jwtModule, "verifyAccessToken").mockImplementation(
    async (token: string) => {
      if (token === "valid-token") {
        return {
          userId: 1,
          username: "alice",
          email: "a@b.com",
          jti: "test-jti",
        };
      }
      throw new Error("Invalid token");
    },
  );
});

afterAll(() => {
  mock.restore();
});

describe("auth.plugin", () => {
  test("injects user into context when token is valid", async () => {
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Bearer valid-token" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(1);
    expect(body.username).toBe("alice");
    expect(body.jti).toBe("test-jti");
  });

  test("returns 401 when Authorization header is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/protected"),
    );
    expect(res.status).toBe(401);
  });

  test("returns 401 when token is invalid (verifyAccessToken throws)", async () => {
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Bearer invalid-token" },
      }),
    );
    expect(res.status).toBe(401);
  });

  test("does not apply auth guard to public routes", async () => {
    const res = await app.handle(new Request("http://localhost/public"));
    expect(res.status).toBe(200);
  });
});
