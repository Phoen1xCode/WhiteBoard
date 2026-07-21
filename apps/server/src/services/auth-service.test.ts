import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRedisForTests } from "../lib/redis";

const users = new Map<string, any>();

vi.mock("../repositories/user-repository", () => ({
  findUserByEmail: async (email: string) =>
    [...users.values()].find((u) => u.email === email) ?? null,
  findUserByUsername: async (username: string) =>
    [...users.values()].find((u) => u.username === username) ?? null,
  findUserById: async (id: string) => users.get(id) ?? null,
  createUser: async (input: { email: string; username: string; passwordHash: string }) => {
    const user = {
      id: `user-${users.size + 1}`,
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.set(user.id, user);
    return user;
  },
}));

import { verifyAccessToken } from "../lib/jwt";
import { getMe, login, logout, refresh, register } from "./auth-service";

describe("auth service", () => {
  beforeEach(() => {
    users.clear();
    resetRedisForTests();
  });

  it("register + login + me", async () => {
    const registered = await register({
      email: "a@example.com",
      username: "alice",
      password: "password123",
    });

    expect(registered.user.email).toBe("a@example.com");
    expect(registered.tokens.accessToken).toBeTruthy();

    const loggedIn = await login({
      email: "a@example.com",
      password: "password123",
    });
    expect(loggedIn.user.username).toBe("alice");

    const me = await getMe(loggedIn.user.id);
    expect(me.email).toBe("a@example.com");
  });

  it("rejects bad password", async () => {
    await register({
      email: "b@example.com",
      username: "bob",
      password: "password123",
    });

    await expect(
      login({ email: "b@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 });
  });

  it("logout blacklists access token; refresh rotates", async () => {
    const registered = await register({
      email: "c@example.com",
      username: "carol",
      password: "password123",
    });

    const accessPayload = verifyAccessToken(registered.tokens.accessToken);
    await logout({
      accessTokenPayload: accessPayload,
      refreshToken: registered.tokens.refreshToken,
    });

    await expect(refresh({ refreshToken: registered.tokens.refreshToken })).rejects.toMatchObject({
      status: 401,
    });

    const again = await login({
      email: "c@example.com",
      password: "password123",
    });
    const rotated = await refresh({ refreshToken: again.tokens.refreshToken });
    expect(rotated.tokens.accessToken).toBeTruthy();
    expect(rotated.tokens.refreshToken).not.toBe(again.tokens.refreshToken);
  });
});
