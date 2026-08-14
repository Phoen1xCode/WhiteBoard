import { createMiddleware } from "hono/factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthMiddleware } from "@/middlewares/auth";
import type { BoardsService } from "@/services/boards.service";

import { createTestApp } from "@/lib/create-app";
import { createBoardsRouter } from "@/routes/boards/boards.index";

const user = { id: "user-1", email: "alice@example.com", username: "alice" };
const board = {
  id: "board-1",
  title: "Untitled Board",
  elements: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
  lastSeq: 0,
};

function setup() {
  const boardsService = {
    listBoards: vi.fn().mockResolvedValue([
      {
        id: board.id,
        title: board.title,
        createdAt: board.updatedAt,
        updatedAt: board.updatedAt,
      },
    ]),
    createBoard: vi.fn().mockResolvedValue(board),
    getBoard: vi.fn().mockResolvedValue(board),
    updateBoardTitle: vi.fn().mockResolvedValue(board),
    deleteBoard: vi.fn().mockResolvedValue(board),
  } as unknown as BoardsService;
  const authMiddleware = createMiddleware(async (c, next) => {
    c.set("accessToken", "session-token");
    c.set("user", user);
    await next();
  }) as AuthMiddleware;

  return {
    app: createTestApp(createBoardsRouter({ boardsService, authMiddleware })),
    boardsService,
  };
}

describe("board routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists boards and creates one with the default title", async () => {
    const { app, boardsService } = setup();
    const listed = await app.request("/api/v1/boards");
    const created = await app.request("/api/v1/boards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    expect(listed.status).toBe(200);
    expect(await listed.json()).toHaveLength(1);
    expect(created.status).toBe(201);
    expect(boardsService.createBoard).toHaveBeenCalledWith("Untitled Board", user.id);
  });

  it("validates updates and deletes without a response body", async () => {
    const { app, boardsService } = setup();
    const invalid = await app.request(`/api/v1/boards/${board.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const removed = await app.request(`/api/v1/boards/${board.id}`, {
      method: "DELETE",
    });

    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(removed.status).toBe(204);
    expect(await removed.text()).toBe("");
    expect(boardsService.deleteBoard).toHaveBeenCalledWith(board.id, user.id);
  });
});
