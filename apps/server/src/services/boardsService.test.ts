import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionRole } from "../../prisma/generated/client";

const boards = new Map<string, any>();
const permissions = new Map<string, any>();

vi.mock("../repositories/board-repository", () => ({
  createBoardWithOwner: async (input: {
    title: string;
    snapshot: unknown;
    ownerId: string;
  }) => {
    const board = {
      id: `board-${boards.size + 1}`,
      title: input.title,
      snapshot: input.snapshot,
      ownerId: input.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    boards.set(board.id, board);
    permissions.set(`${board.id}:${input.ownerId}`, {
      boardId: board.id,
      userId: input.ownerId,
      role: PermissionRole.OWNER,
    });
    return board;
  },
  findBoardById: async (id: string) => boards.get(id) ?? null,
  findBoardSnapshotWithSeq: async (id: string) => {
    const board = boards.get(id);
    if (!board) return null;
    return { board, lastSeq: 0 };
  },
  listBoardsByUserId: async (userId: string) =>
    [...boards.values()].filter((b) =>
      [...permissions.values()].some((p) => p.boardId === b.id && p.userId === userId)
    ),
  updateBoardTitle: async (id: string, title: string) => {
    const board = boards.get(id);
    board.title = title;
    board.updatedAt = new Date();
    return board;
  },
  deleteBoardById: async (id: string) => {
    const board = boards.get(id);
    boards.delete(id);
    return board;
  },
}));

vi.mock("../repositories/permission-repository", () => ({
  findPermission: async (boardId: string, userId: string) =>
    permissions.get(`${boardId}:${userId}`) ?? null,
}));

import {
  assertCanEditBoard,
  createBoard,
  deleteBoard,
  getBoard,
} from "./boardsService";

describe("board permissions", () => {
  beforeEach(() => {
    boards.clear();
    permissions.clear();
  });

  it("owner can create/get/delete; stranger is forbidden", async () => {
    const board = await createBoard("Demo", "owner-1");
    expect(board.title).toBe("Demo");
    expect(board.lastSeq).toBe(0);

    await expect(getBoard(board.id, "owner-1")).resolves.toMatchObject({
      id: board.id,
    });

    await expect(getBoard(board.id, "stranger")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });

    await expect(deleteBoard(board.id, "stranger")).rejects.toMatchObject({
      status: 403,
    });

    await expect(deleteBoard(board.id, "owner-1")).resolves.toBeTruthy();
  });

  it("viewer cannot edit", async () => {
    const board = await createBoard("View", "owner-1");
    permissions.set(`${board.id}:viewer-1`, {
      boardId: board.id,
      userId: "viewer-1",
      role: PermissionRole.VIEWER,
    });

    await expect(assertCanEditBoard(board.id, "viewer-1")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });
});
