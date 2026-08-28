import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn(),
  resolveAccessToken: vi.fn(),
  service: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { handler: mocks.authHandler },
  resolveAccessToken: mocks.resolveAccessToken,
}));

vi.mock("@/services/auth", () => ({ authService: mocks.service }));

import { createApp } from "@/app";

const user = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const authResult = {
  user,
  tokens: { accessToken: "jwt-access-token", refreshToken: "session-token" },
};

function setup() {
  const onLogout = vi.fn();
  return { app: createApp({ onLogout }), onLogout };
}

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authHandler.mockResolvedValue(new Response(null, { status: 204 }));
    mocks.resolveAccessToken.mockResolvedValue({
      token: "session-token",
      user: { id: user.id, email: user.email, username: user.username },
    });
    mocks.service.register.mockResolvedValue(authResult);
    mocks.service.login.mockResolvedValue(authResult);
    mocks.service.refresh.mockResolvedValue(authResult);
    mocks.service.logout.mockResolvedValue(undefined);
    mocks.service.getMe.mockResolvedValue(user);
  });

  it("rejects protected routes without a bearer token", async () => {
    const { app } = setup();
    const response = await app.request("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });

  it("validates registration with the project error shape", async () => {
    const { app } = setup();
    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "invalid", password: "short" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("keeps username length validation aligned with the public form", async () => {
    const { app } = setup();
    const accepted = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        username: "abc",
        password: "password123",
      }),
    });
    const rejected = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        username: "abcdefghijklmnop",
        password: "password123",
      }),
    });

    expect(accepted.status).toBe(201);
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(mocks.service.register).toHaveBeenCalledTimes(1);
    expect(mocks.service.register).toHaveBeenCalledWith(
      expect.objectContaining({ username: "abc" }),
      expect.any(Headers),
    );
  });

  it("maps Better Auth rate limiting onto login and register", async () => {
    mocks.authHandler.mockResolvedValue(
      new Response(JSON.stringify({ message: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { "X-Retry-After": "12" },
      }),
    );
    const { app } = setup();

    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "password123" }),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
    expect(response.headers.get("X-Retry-After")).toBe("12");
    expect(await response.json()).toEqual({
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
    expect(mocks.service.login).not.toHaveBeenCalled();
  });

  it("registers and logs out through the auth service", async () => {
    const { app, onLogout } = setup();
    const registered = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        username: user.username,
        password: "password123",
      }),
    });
    const loggedOut = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        authorization: "Bearer session-token",
        "content-type": "application/json",
      },
      body: "{}",
    });

    expect(registered.status).toBe(201);
    expect(await registered.json()).toEqual(authResult);
    expect(loggedOut.status).toBe(200);
    expect(mocks.service.logout).toHaveBeenCalledWith("session-token", undefined);
    expect(onLogout).toHaveBeenCalledWith(user.id);
  });
});
