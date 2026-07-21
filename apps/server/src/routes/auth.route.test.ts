import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { resetRedisForTests } from "../lib/redis";

const users = new Map<string, any>();

vi.mock("../repositories/user-repository", () => ({
  findUserByEmail: async (email: string) =>
    [...users.values()].find((u) => u.email === email) ?? null,
  findUserByUsername: async (username: string) =>
    [...users.values()].find((u) => u.username === username) ?? null,
  findUserById: async (id: string) => users.get(id) ?? null,
  createUser: async (input: {
    email: string;
    username: string;
    passwordHash: string;
  }) => {
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

import { createApp } from "../app";
import { verifyAccessToken } from "../lib/jwt";
import { isTokenBlacklisted } from "../lib/token-blacklist";

describe("auth HTTP routes", () => {
  beforeEach(() => {
    users.clear();
    resetRedisForTests();
  });

  it("register/login/me and rejects unauthorized + blacklisted", async () => {
    const app = createApp();
    const server = app.callback();

    await request(server).get("/api/v1/auth/me").expect(401);

    const registered = await request(server)
      .post("/api/v1/auth/register")
      .send({
        email: "route@example.com",
        username: "router",
        password: "password123",
      })
      .expect(201);

    expect(registered.body.success).toBe(true);
    const accessToken = registered.body.data.tokens.accessToken as string;

    const me = await request(server)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(me.body.data.user.username).toBe("router");

    await request(server)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(200);

    const payload = verifyAccessToken(accessToken);
    expect(await isTokenBlacklisted(payload.jti)).toBe(true);

    // koa-jwt isRevoked should reject blacklisted token
    await request(server)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);
  });
});
