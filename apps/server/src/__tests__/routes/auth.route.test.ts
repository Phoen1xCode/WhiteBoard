import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockState = {
  registerResult: {
    user: { id: 1, email: "a@b.com", username: "alice" },
    accessToken: "at",
    refreshToken: "rt",
  } as any,
  loginResult: {
    user: { id: 1, email: "a@b.com", username: "alice" },
    accessToken: "at",
    refreshToken: "rt",
  } as any,
  refreshResult: { accessToken: "at2", refreshToken: "rt2" } as any,
  getMeResult: { id: 1, email: "a@b.com", username: "alice" } as any,
};

mock.module("../../services/auth.service", () => ({
  register: mock(() => Promise.resolve(mockState.registerResult)),
  login: mock(() => Promise.resolve(mockState.loginResult)),
  refreshTokens: mock(() => Promise.resolve(mockState.refreshResult)),
  logout: mock(() => Promise.resolve()),
  getMe: mock(() => Promise.resolve(mockState.getMeResult)),
  isTokenBlacklisted: mock(() => Promise.resolve(false)),
  AuthError: class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

mock.module("../../lib/jwt", () => ({
  verifyAccessToken: mock(async () => ({
    userId: 1,
    username: "alice",
    email: "a@b.com",
    jti: "test-jti",
  })),
}));

mock.module("../../lib/redis", () => ({
  getRedis: () => ({
    pipeline: () => ({
      zremrangebyscore: function () { return this; },
      zadd: function () { return this; },
      zcount: function () { return this; },
      expire: function () { return this; },
      exec: mock(() => Promise.resolve([[null, 0], [null, 1], [null, 1], [null, 1]])),
    }),
    smembers: mock(() => Promise.resolve([])),
  }),
  initRedis: mock(),
  getRedisSub: mock(),
  closeRedis: mock(),
}));

import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { authRoute } from "../../routes/auth.route";
import { AuthError } from "../../services/auth.service";

const app = new Elysia()
  .use(authPlugin)
  .use(authRoute)
  .onError(({ error, set }) => {
    if (error instanceof AuthError) {
      set.status = error.status;
      return { error: error.message };
    }
    set.status = 500;
    return { error: "Internal Server Error" };
  });

const BASE = "http://localhost";

describe("POST /api/v1/auth/register", () => {
  test("returns 201 with user and tokens", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "a@b.com",
          username: "alice",
          password: "password123",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("a@b.com");
    expect(body.accessToken).toBe("at");
  });

  test("returns 422 when body is missing required fields", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );
    expect(res.status).toBe(422);
  });
});

describe("POST /api/v1/auth/login", () => {
  test("returns 200 with tokens", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.com", password: "password123" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBe("at");
  });

  test("returns 422 when password is missing", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );
    expect(res.status).toBe(422);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  test("returns 200 with new tokens", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "rt" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBe("at2");
  });
});

describe("POST /api/v1/auth/logout", () => {
  test("returns 200 when authenticated", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
      }),
    );
    expect(res.status).toBe(200);
  });

  test("returns 401 when not authenticated", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/logout`, { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  test("returns 200 with user when authenticated", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/auth/me`, {
        headers: { Authorization: "Bearer valid-token" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(1);
  });

  test("returns 401 when not authenticated", async () => {
    const res = await app.handle(new Request(`${BASE}/api/v1/auth/me`));
    expect(res.status).toBe(401);
  });
});
