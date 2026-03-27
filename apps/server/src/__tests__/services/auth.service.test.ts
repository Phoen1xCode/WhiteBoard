import { describe, test, expect, mock, beforeEach } from "bun:test";

// Mock the repository and redis modules
const mockUserRepo = {
  findByEmail: mock(() => null),
  findByUsername: mock(() => null),
  findById: mock(() => null),
  create: mock(() => ({
    id: 1,
    email: "a@b.com",
    username: "alice",
    password: "hashed",
    createdAt: new Date(),
  })),
};

const mockRedis = {
  set: mock(() => Promise.resolve("OK")),
  get: mock(() => Promise.resolve(null)),
};

mock.module("../../repositories/user.repository", () => mockUserRepo);
mock.module("../../lib/redis", () => ({
  getRedis: () => mockRedis,
  initRedis: mock(),
  getRedisSub: mock(),
  closeRedis: mock(),
}));

import { register, login, logout } from "../../services/auth.service";

describe("auth.service", () => {
  beforeEach(() => {
    mockUserRepo.findByEmail.mockReset();
    mockUserRepo.findByUsername.mockReset();
    mockUserRepo.findById.mockReset();
    mockUserRepo.create.mockReset();
    mockRedis.set.mockReset();
    mockRedis.get.mockReset();
  });

  test("register creates user and returns tokens", async () => {
    mockUserRepo.findByEmail.mockReturnValue(Promise.resolve(null));
    mockUserRepo.findByUsername.mockReturnValue(Promise.resolve(null));
    mockUserRepo.create.mockReturnValue(
      Promise.resolve({
        id: 1,
        email: "a@b.com",
        username: "alice",
        password: "hashed",
        createdAt: new Date(),
      }),
    );

    const result = await register("a@b.com", "alice", "password123");
    expect(result.user.id).toBe(1);
    expect(result.user.email).toBe("a@b.com");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  test("register throws if email already exists", async () => {
    mockUserRepo.findByEmail.mockReturnValue(
      Promise.resolve({
        id: 1,
        email: "a@b.com",
        username: "alice",
        password: "h",
        createdAt: new Date(),
      }),
    );

    await expect(register("a@b.com", "alice", "password123")).rejects.toThrow(
      "Email already registered",
    );
  });

  test("register throws if username already exists", async () => {
    mockUserRepo.findByEmail.mockReturnValue(Promise.resolve(null));
    mockUserRepo.findByUsername.mockReturnValue(
      Promise.resolve({
        id: 1,
        email: "x@y.com",
        username: "alice",
        password: "h",
        createdAt: new Date(),
      }),
    );

    await expect(register("a@b.com", "alice", "password123")).rejects.toThrow(
      "Username already taken",
    );
  });

  test("login returns tokens for valid credentials", async () => {
    const hash = await Bun.password.hash("password123", {
      algorithm: "argon2id",
    });
    mockUserRepo.findByEmail.mockReturnValue(
      Promise.resolve({
        id: 1,
        email: "a@b.com",
        username: "alice",
        password: hash,
        createdAt: new Date(),
      }),
    );

    const result = await login("a@b.com", "password123");
    expect(result.user.id).toBe(1);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  test("login throws for wrong password", async () => {
    const hash = await Bun.password.hash("correct", { algorithm: "argon2id" });
    mockUserRepo.findByEmail.mockReturnValue(
      Promise.resolve({
        id: 1,
        email: "a@b.com",
        username: "alice",
        password: hash,
        createdAt: new Date(),
      }),
    );

    await expect(login("a@b.com", "wrong")).rejects.toThrow(
      "Invalid credentials",
    );
  });
});
