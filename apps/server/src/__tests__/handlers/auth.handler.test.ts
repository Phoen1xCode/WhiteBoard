import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockAuthService = {
  register: mock(() =>
    Promise.resolve({
      user: { id: 1, email: "a@b.com", username: "alice" },
      accessToken: "at",
      refreshToken: "rt",
    }),
  ),
  login: mock(() =>
    Promise.resolve({
      user: { id: 1, email: "a@b.com", username: "alice" },
      accessToken: "at",
      refreshToken: "rt",
    }),
  ),
  refreshTokens: mock(() => Promise.resolve({ accessToken: "at2", refreshToken: "rt2" })),
  logout: mock(() => Promise.resolve()),
  getMe: mock(() => Promise.resolve({ id: 1, email: "a@b.com", username: "alice" })),
  AuthError: class extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
};

mock.module("../../services/auth.service", () => mockAuthService);
mock.module("../../middleware/auth", () => ({
  requireAuth: mock((req: Request) => {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    return { userId: 1, email: "a@b.com", username: "alice", jti: "test-jti" };
  }),
}));

import { handleAuthRoute } from "../../handlers/auth.handler";

describe("auth.handler", () => {
  beforeEach(() => {
    mockAuthService.register.mockClear();
    mockAuthService.login.mockClear();
  });

  test("POST /api/v1/auth/register returns 201 with tokens", async () => {
    const req = new Request("http://localhost/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", username: "alice", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRoute(req, "/api/v1/auth/register");
    expect(res!.status).toBe(201);
    const body = await res!.json();
    expect(body.user.email).toBe("a@b.com");
    expect(body.accessToken).toBe("at");
  });

  test("POST /api/v1/auth/login returns 200 with tokens", async () => {
    const req = new Request("http://localhost/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRoute(req, "/api/v1/auth/login");
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.accessToken).toBe("at");
  });

  test("returns null for non-auth routes", async () => {
    const req = new Request("http://localhost/api/v1/boards", { method: "GET" });
    const res = await handleAuthRoute(req, "/api/v1/boards");
    expect(res).toBeNull();
  });
});
