import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getToken: vi.fn(),
  verifyJWT: vi.fn(),
}));

vi.mock("better-auth", () => ({
  betterAuth: () => ({
    api: {
      getSession: mocks.getSession,
      getToken: mocks.getToken,
      verifyJWT: mocks.verifyJWT,
    },
  }),
}));
vi.mock("better-auth/adapters/prisma", () => ({ prismaAdapter: vi.fn(() => ({})) }));
vi.mock("better-auth/plugins", () => ({
  bearer: vi.fn(() => ({})),
  jwt: vi.fn(() => ({})),
  username: vi.fn(() => ({})),
}));
vi.mock("@/config", () => ({
  config: {
    betterAuthSecret: "test-secret-test-secret-test-secret",
    betterAuthURL: "http://localhost:4000",
  },
}));
vi.mock("@/db", () => ({ db: {} }));

import { bearerHeaders, isJWT, issueAccessToken, resolveAccessToken } from "@/lib/auth";

const sessionUser = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
};

describe("auth token helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recognizes complete JWT shapes and creates bearer headers", () => {
    expect(isJWT("header.payload.signature")).toBe(true);
    expect(isJWT("header..signature")).toBe(false);
    expect(isJWT("session-token")).toBe(false);
    expect(bearerHeaders("token-1").get("authorization")).toBe("Bearer token-1");
  });

  it("issues an access token and maps missing token responses to an internal error", async () => {
    mocks.getToken.mockResolvedValueOnce({ token: "header.payload.signature" });
    await expect(issueAccessToken("session-token")).resolves.toBe("header.payload.signature");

    mocks.getToken.mockResolvedValueOnce(null);
    await expect(issueAccessToken("invalid-session")).rejects.toMatchObject({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("resolves opaque session tokens into the authenticated user", async () => {
    mocks.getSession.mockResolvedValueOnce({ user: sessionUser });

    await expect(resolveAccessToken("session-token")).resolves.toEqual({
      token: "session-token",
      user: sessionUser,
    });
    const headers = mocks.getSession.mock.calls[0]?.[0]?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer session-token");

    mocks.getSession.mockResolvedValueOnce({ user: { ...sessionUser, username: null } });
    await expect(resolveAccessToken("invalid-session")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("requires identity claims when resolving JWT access tokens", async () => {
    mocks.verifyJWT.mockResolvedValueOnce({
      payload: {
        sub: sessionUser.id,
        email: sessionUser.email,
        username: sessionUser.username,
      },
    });
    await expect(resolveAccessToken("header.payload.signature")).resolves.toEqual({
      token: "header.payload.signature",
      user: sessionUser,
    });

    mocks.verifyJWT.mockResolvedValueOnce({ payload: { sub: sessionUser.id } });
    await expect(resolveAccessToken("invalid.payload.signature")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });
});
