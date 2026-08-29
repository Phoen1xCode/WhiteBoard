import { PermissionRole } from "@generated/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  boardCreate: vi.fn(),
  boardDelete: vi.fn(),
  boardFindMany: vi.fn(),
  boardFindUnique: vi.fn(),
  boardUpdate: vi.fn(),
  operationFindFirst: vi.fn(),
  permissionCreate: vi.fn(),
  permissionFindUnique: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    board: {
      delete: mocks.boardDelete,
      findMany: mocks.boardFindMany,
      findUnique: mocks.boardFindUnique,
      update: mocks.boardUpdate,
    },
    permission: { findUnique: mocks.permissionFindUnique },
    $transaction: mocks.transaction,
  },
}));

import {
  boardsService,
  requireBoardEdit,
  requireBoardOwner,
  requireBoardView,
} from "@/services/boards";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");
const board = {
  id: "board-1",
  title: "Planning",
  snapshot: { elements: [] },
  ownerId: "user-1",
  createdAt,
  updatedAt,
};
const transactionClient = {
  board: { create: mocks.boardCreate, update: mocks.boardUpdate },
  operation: { findFirst: mocks.operationFindFirst },
  permission: { create: mocks.permissionCreate },
  $queryRaw: mocks.queryRaw,
};

describe("boards service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.boardFindUnique.mockResolvedValue(board);
    mocks.permissionFindUnique.mockResolvedValue({ role: PermissionRole.OWNER });
    mocks.boardCreate.mockResolvedValue(board);
    mocks.permissionCreate.mockResolvedValue({ id: "permission-1" });
    mocks.queryRaw.mockResolvedValue([board]);
    mocks.operationFindFirst.mockResolvedValue({ seq: 7 });
    mocks.boardUpdate.mockResolvedValue(board);
    mocks.boardDelete.mockResolvedValue(board);
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => unknown) => callback(transactionClient),
    );
  });

  it("distinguishes missing boards from missing permissions", async () => {
    mocks.boardFindUnique.mockResolvedValueOnce(null);
    await expect(requireBoardView("missing", "user-1")).rejects.toMatchObject({
      status: 404,
      code: "BOARD_NOT_FOUND",
    });
    expect(mocks.permissionFindUnique).not.toHaveBeenCalled();

    mocks.permissionFindUnique.mockResolvedValueOnce(null);
    await expect(requireBoardView("board-1", "user-2")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("enforces viewer, editor and owner permission boundaries", async () => {
    mocks.permissionFindUnique.mockResolvedValue({ role: PermissionRole.VIEWER });
    await expect(requireBoardView("board-1", "user-2")).resolves.toEqual(board);
    await expect(requireBoardEdit("board-1", "user-2")).rejects.toMatchObject({
      status: 403,
      message: "Editor permission is required",
    });

    mocks.permissionFindUnique.mockResolvedValue({ role: PermissionRole.EDITOR });
    await expect(requireBoardEdit("board-1", "user-2")).resolves.toEqual(board);
    await expect(requireBoardOwner("board-1", "user-2")).rejects.toMatchObject({
      status: 403,
      message: "Owner permission is required",
    });

    mocks.permissionFindUnique.mockResolvedValue({ role: PermissionRole.OWNER });
    await expect(requireBoardOwner("board-1", "user-1")).resolves.toEqual(board);
  });

  it("creates the board and owner permission in one transaction", async () => {
    const result = await boardsService.createBoard("Planning", "user-1");

    expect(mocks.boardCreate).toHaveBeenCalledWith({
      data: {
        title: "Planning",
        snapshot: { elements: [] },
        ownerId: "user-1",
      },
    });
    expect(mocks.permissionCreate).toHaveBeenCalledWith({
      data: {
        boardId: "board-1",
        userId: "user-1",
        role: PermissionRole.OWNER,
      },
    });
    expect(result).toEqual({
      id: "board-1",
      title: "Planning",
      elements: [],
      updatedAt: updatedAt.toISOString(),
      lastSeq: 7,
    });
  });

  it("updates editable boards and only deletes owner boards", async () => {
    mocks.permissionFindUnique.mockResolvedValue({ role: PermissionRole.EDITOR });
    const updated = await boardsService.updateBoardTitle("board-1", "Roadmap", "user-2");

    expect(mocks.boardUpdate).toHaveBeenCalledWith({
      where: { id: "board-1" },
      data: { title: "Roadmap" },
    });
    expect(updated.lastSeq).toBe(7);

    await expect(boardsService.deleteBoard("board-1", "user-2")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    expect(mocks.boardDelete).not.toHaveBeenCalled();

    mocks.permissionFindUnique.mockResolvedValue({ role: PermissionRole.OWNER });
    await boardsService.deleteBoard("board-1", "user-1");
    expect(mocks.boardDelete).toHaveBeenCalledWith({ where: { id: "board-1" } });
  });

  it("lists accessible boards with serialized dates in database order", async () => {
    mocks.boardFindMany.mockResolvedValue([
      { id: "board-1", title: "Planning", createdAt, updatedAt },
      {
        id: "board-2",
        title: "Archive",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-02-01T00:00:00.000Z"),
      },
    ]);

    const result = await boardsService.listBoards("user-1");

    expect(mocks.boardFindMany).toHaveBeenCalledWith({
      where: { permissions: { some: { userId: "user-1" } } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    expect(result[0]).toEqual({
      id: "board-1",
      title: "Planning",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });
});
