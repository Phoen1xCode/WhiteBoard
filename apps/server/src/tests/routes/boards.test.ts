import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn(),
  resolveAccessToken: vi.fn(),
  service: {
    listBoards: vi.fn(),
    createBoard: vi.fn(),
    getBoard: vi.fn(),
    updateBoardTitle: vi.fn(),
    deleteBoard: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { handler: mocks.authHandler },
  resolveAccessToken: mocks.resolveAccessToken,
}));

vi.mock("@/services/boards", () => ({ boardsService: mocks.service }));

import { createApp } from "@/app";

const user = { id: "user-1", email: "alice@example.com", username: "alice" };
const board = {
  id: "board-1",
  title: "Untitled Board",
  elements: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
  lastSeq: 0,
};

function authorizationHeaders(): HeadersInit {
  return { authorization: "Bearer session-token" };
}

describe("board routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authHandler.mockResolvedValue(new Response(null, { status: 204 }));
    mocks.resolveAccessToken.mockResolvedValue({ token: "session-token", user });
    mocks.service.listBoards.mockResolvedValue([
      {
        id: board.id,
        title: board.title,
        createdAt: board.updatedAt,
        updatedAt: board.updatedAt,
      },
    ]);
    mocks.service.createBoard.mockResolvedValue(board);
    mocks.service.getBoard.mockResolvedValue(board);
    mocks.service.updateBoardTitle.mockResolvedValue(board);
    mocks.service.deleteBoard.mockResolvedValue(undefined);
  });

  it("lists boards and creates one with the default title", async () => {
    const app = createApp();
    const listed = await app.request("/api/v1/boards", {
      headers: authorizationHeaders(),
    });
    const created = await app.request("/api/v1/boards", {
      method: "POST",
      headers: {
        ...authorizationHeaders(),
        "content-type": "application/json",
      },
      body: "{}",
    });

    expect(listed.status).toBe(200);
    expect(await listed.json()).toHaveLength(1);
    expect(created.status).toBe(201);
    expect(mocks.service.createBoard).toHaveBeenCalledWith("Untitled Board", user.id);
  });

  it("gets a board and updates its title", async () => {
    const app = createApp();
    const fetched = await app.request(`/api/v1/boards/${board.id}`, {
      headers: authorizationHeaders(),
    });
    const updated = await app.request(`/api/v1/boards/${board.id}`, {
      method: "PATCH",
      headers: {
        ...authorizationHeaders(),
        "content-type": "application/json",
      },
      body: JSON.stringify({ title: "Roadmap" }),
    });

    expect(fetched.status).toBe(200);
    expect(await fetched.json()).toEqual(board);
    expect(mocks.service.getBoard).toHaveBeenCalledWith(board.id, user.id);
    expect(updated.status).toBe(200);
    expect(mocks.service.updateBoardTitle).toHaveBeenCalledWith(board.id, "Roadmap", user.id);
  });

  it("validates updates and deletes without a response body", async () => {
    const app = createApp();
    const invalid = await app.request(`/api/v1/boards/${board.id}`, {
      method: "PATCH",
      headers: {
        ...authorizationHeaders(),
        "content-type": "application/json",
      },
      body: JSON.stringify({ title: "" }),
    });
    const removed = await app.request(`/api/v1/boards/${board.id}`, {
      method: "DELETE",
      headers: authorizationHeaders(),
    });

    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(removed.status).toBe(204);
    expect(await removed.text()).toBe("");
    expect(mocks.service.deleteBoard).toHaveBeenCalledWith(board.id, user.id);
  });
});
