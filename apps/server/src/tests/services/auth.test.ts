import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteSessions: vi.fn(),
  findUser: vi.fn(),
  getSession: vi.fn(),
  issueAccessToken: vi.fn(),
  signInEmail: vi.fn(),
  signOut: vi.fn(),
  signUpEmail: vi.fn(),
  verifyJWT: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    session: { deleteMany: mocks.deleteSessions },
    user: { findUnique: mocks.findUser },
  },
}));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
      signInEmail: mocks.signInEmail,
      signOut: mocks.signOut,
      signUpEmail: mocks.signUpEmail,
      verifyJWT: mocks.verifyJWT,
    },
  },
  bearerHeaders: (token: string) => new Headers({ authorization: `Bearer ${token}` }),
  isJWT: (token: string) => {
    const parts = token.split(".");
    return parts.length === 3 && parts.every(Boolean);
  },
  issueAccessToken: mocks.issueAccessToken,
}));

import { authService } from "@/services/auth";

const user = {
  id: "user-1",
  email: "alice@example.com",
  emailVerified: false,
  name: "Alice",
  username: "alice",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUser.mockResolvedValue(null);
    mocks.issueAccessToken.mockResolvedValue("header.payload.signature");
  });

  it("checks normalized username uniqueness before creating an account", async () => {
    mocks.findUser
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-user", username: "alice" });

    await expect(
      authService.register(
        { email: "new@example.com", username: "Alice", password: "password123" },
        new Headers(),
      ),
    ).rejects.toMatchObject({ status: 409, code: "USERNAME_ALREADY_EXISTS" });
    expect(mocks.findUser).toHaveBeenNthCalledWith(2, {
      where: { username: "alice" },
    });
    expect(mocks.signUpEmail).not.toHaveBeenCalled();
  });

  it("refreshes a valid session and rejects an invalid refresh token", async () => {
    mocks.getSession.mockResolvedValueOnce(null);
    await expect(authService.refresh("invalid-session")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });

    mocks.getSession.mockResolvedValueOnce({ user, session: { token: "renewed-session" } });
    const result = await authService.refresh("valid-session");

    expect(result).toEqual({
      user: {
        id: "user-1",
        email: "alice@example.com",
        username: "alice",
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens: {
        accessToken: "header.payload.signature",
        refreshToken: "renewed-session",
      },
    });
    expect(mocks.issueAccessToken).toHaveBeenCalledWith("renewed-session");
  });

  it("revokes the Better Auth session token when one is available", async () => {
    await authService.logout("header.payload.signature", "refresh-session");

    expect(mocks.signOut).toHaveBeenCalledOnce();
    const headers = mocks.signOut.mock.calls[0]?.[0]?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer refresh-session");
    expect(mocks.verifyJWT).not.toHaveBeenCalled();
    expect(mocks.deleteSessions).not.toHaveBeenCalled();
  });

  it("revokes all user sessions when logout only receives a JWT", async () => {
    mocks.verifyJWT.mockResolvedValue({ payload: { sub: "user-1" } });

    await authService.logout("header.payload.signature");

    expect(mocks.verifyJWT).toHaveBeenCalledWith({
      body: { token: "header.payload.signature" },
    });
    expect(mocks.deleteSessions).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("returns the public user shape and rejects deleted users", async () => {
    mocks.findUser.mockResolvedValueOnce(user);
    await expect(authService.getMe("user-1")).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      username: "alice",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    mocks.findUser.mockResolvedValueOnce(null);
    await expect(authService.getMe("deleted-user")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });
});
