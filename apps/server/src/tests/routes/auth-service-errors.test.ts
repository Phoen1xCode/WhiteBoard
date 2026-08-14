import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn(),
  findUser: vi.fn(),
  issueAccessToken: vi.fn(),
  resolveAccessToken: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    user: { findUnique: mocks.findUser },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInEmail: mocks.signInEmail,
      signUpEmail: mocks.signUpEmail,
    },
    handler: mocks.authHandler,
  },
  bearerHeaders: (token: string) => new Headers({ authorization: `Bearer ${token}` }),
  isJWT: (token: string) => token.split(".").length === 3,
  issueAccessToken: mocks.issueAccessToken,
  resolveAccessToken: mocks.resolveAccessToken,
}));

import { createApp } from "@/app";

const user = {
  id: "user-1",
  email: "alice@example.com",
  emailVerified: false,
  name: "alice",
  username: "alice",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("auth service error mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.authHandler.mockResolvedValue(new Response(null, { status: 204 }));
    mocks.findUser.mockResolvedValue(null);
    mocks.issueAccessToken.mockResolvedValue("jwt-access-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 409 when Better Auth reports an existing email", async () => {
    mocks.signUpEmail.mockRejectedValue(
      new APIError("UNPROCESSABLE_ENTITY", {
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists. Use another email.",
      }),
    );

    const response = await createApp().request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "Alice@example.com",
        username: "alice",
        password: "password123",
      }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: { code: "EMAIL_ALREADY_EXISTS", message: "Email already exists" },
    });
  });

  it("does not report token issuance failures as invalid credentials", async () => {
    mocks.signInEmail.mockResolvedValue({ token: "session-token", user });
    mocks.issueAccessToken.mockRejectedValue(
      new APIError("INTERNAL_SERVER_ERROR", {
        code: "FAILED_TO_ISSUE_TOKEN",
        message: "Failed to issue token",
      }),
    );

    const response = await createApp().request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "password123" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Internal Server Error" },
    });
  });

  it("returns 401 for invalid credentials", async () => {
    mocks.signInEmail.mockRejectedValue(
      new APIError("UNAUTHORIZED", {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    );

    const response = await createApp().request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "password123" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
    });
  });
});
