import { createMiddleware } from "hono/factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BetterAuth } from "@/lib/better-auth";
import type { ResolveAccessToken } from "@/lib/token";
import type { AuthService } from "@/services/auth.service";

import { createTestApp } from "@/lib/create-app";
import { createAuthMiddleware, type AuthMiddleware } from "@/middlewares/auth";
import { createAuthRouter } from "@/routes/auth/auth.index";

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

function setup(authMiddlewareOverride?: AuthMiddleware) {
  const authService = {
    register: vi.fn().mockResolvedValue(authResult),
    login: vi.fn().mockResolvedValue(authResult),
    refresh: vi.fn().mockResolvedValue(authResult),
    logout: vi.fn().mockResolvedValue(undefined),
    getMe: vi.fn().mockResolvedValue(user),
  } as unknown as AuthService;
  const auth = {
    handler: vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  } as unknown as BetterAuth;
  const authMiddleware =
    authMiddlewareOverride ??
    (createMiddleware(async (c, next) => {
      c.set("accessToken", "session-token");
      c.set("user", { id: user.id, email: user.email, username: user.username });
      await next();
    }) as AuthMiddleware);
  const onLogout = vi.fn();

  return {
    app: createTestApp(createAuthRouter({ auth, authService, authMiddleware, onLogout })),
    authService,
    onLogout,
  };
}

describe("auth routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects protected routes without a bearer token", async () => {
    const { app } = setup(createAuthMiddleware(vi.fn() as ResolveAccessToken));
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

  it("registers and logs out through injected services", async () => {
    const { app, authService, onLogout } = setup();
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
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    expect(registered.status).toBe(201);
    expect(await registered.json()).toEqual(authResult);
    expect(loggedOut.status).toBe(200);
    expect(authService.logout).toHaveBeenCalledWith("session-token");
    expect(onLogout).toHaveBeenCalledWith(user.id);
  });
});
