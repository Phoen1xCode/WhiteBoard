import { describe, test, expect, mock } from "bun:test";

const mockBoard = {
  id: "board-1",
  title: "My Board",
  ownerId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

mock.module("../../services/board.service", () => ({
  listBoards: mock(() => Promise.resolve([mockBoard])),
  createBoard: mock(() => Promise.resolve(mockBoard)),
  getBoard: mock(() => Promise.resolve(mockBoard)),
  updateBoard: mock(() => Promise.resolve({ ...mockBoard, title: "Updated" })),
  deleteBoard: mock(() => Promise.resolve()),
  BoardError: class BoardError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

mock.module("../../lib/jwt", () => ({
  verifyAccessToken: mock(async () => ({
    userId: 1,
    username: "alice",
    email: "a@b.com",
    jti: "test-jti",
  })),
}));

mock.module("../../services/auth.service", () => ({
  isTokenBlacklisted: mock(() => Promise.resolve(false)),
}));

import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { boardRoute } from "../../routes/board.route";
import { errorHandler } from "../../lib/error-handler";

const app = new Elysia()
  .use(authPlugin)
  .use(boardRoute)
  .onError(errorHandler);

const AUTH = { Authorization: "Bearer valid-token" };
const BASE = "http://localhost";

describe("GET /api/v1/boards", () => {
  test("returns 200 with boards array when authenticated", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/boards`, { headers: AUTH }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].id).toBe("board-1");
  });

  test("returns 401 when not authenticated", async () => {
    const res = await app.handle(new Request(`${BASE}/api/v1/boards`));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/boards", () => {
  test("returns 201 with created board", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/boards`, {
        method: "POST",
        headers: { ...AUTH, "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My Board" }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("board-1");
  });

  test("returns 201 with empty body (title is optional)", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/boards`, {
        method: "POST",
        headers: { ...AUTH, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("GET /api/v1/boards/:id", () => {
  test("returns 200 with board data", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/boards/board-1`, { headers: AUTH }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("board-1");
  });
});

describe("PATCH /api/v1/boards/:id", () => {
  test("returns 200 with updated board", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/boards/board-1`, {
        method: "PATCH",
        headers: { ...AUTH, "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Updated");
  });
});

describe("DELETE /api/v1/boards/:id", () => {
  test("returns 204 with no body", async () => {
    const res = await app.handle(
      new Request(`${BASE}/api/v1/boards/board-1`, {
        method: "DELETE",
        headers: AUTH,
      }),
    );
    expect(res.status).toBe(204);
    // Do NOT parse body — 204 has no content
  });
});
