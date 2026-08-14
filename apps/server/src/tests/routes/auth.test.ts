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
  tokens: { accessToken: "session-token", refreshToken: "session-token" },
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
    expect(mocks.service.logout).toHaveBeenCalledWith("session-token");
    expect(onLogout).toHaveBeenCalledWith(user.id);
  });
});
