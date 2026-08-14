import type { BoardListItem, BoardSnapshot } from "@whiteboard/shared/schemas";

import { PermissionRole } from "@generated/client";

import { db } from "@/db";
import { HttpError } from "@/lib/errors";
import { parseSnapshotElements } from "@/services/board-state";

function isEditRole(role: PermissionRole): boolean {
  return role === PermissionRole.OWNER || role === PermissionRole.EDITOR;
}

async function loadBoardAndRole(boardId: string, userId: string) {
  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board) {
    throw new HttpError(404, "BOARD_NOT_FOUND", "Board not found");
  }

  const permission = await db.permission.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!permission) {
    throw new HttpError(403, "FORBIDDEN", "No permission to access this board");
  }

  return { board, role: permission.role };
}

export async function requireBoardView(boardId: string, userId: string) {
  return (await loadBoardAndRole(boardId, userId)).board;
}

export async function requireBoardEdit(boardId: string, userId: string) {
  const { board, role } = await loadBoardAndRole(boardId, userId);
  if (!isEditRole(role)) {
    throw new HttpError(403, "FORBIDDEN", "Editor permission is required");
  }
  return board;
}

export async function requireBoardOwner(boardId: string, userId: string) {
  const { board, role } = await loadBoardAndRole(boardId, userId);
  if (role !== PermissionRole.OWNER) {
    throw new HttpError(403, "FORBIDDEN", "Owner permission is required");
  }
  return board;
}

async function readSnapshotWithSeq(boardId: string): Promise<BoardSnapshot> {
  const result = await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      Array<{
        id: string;
        title: string;
        snapshot: unknown;
        updatedAt: Date;
      }>
    >`
      SELECT id, title, snapshot, "updatedAt"
      FROM "Board"
      WHERE id = ${boardId}
      FOR SHARE
    `;

    const row = locked[0];
    if (!row) return null;

    const latest = await tx.operation.findFirst({
      where: { boardId },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });

    return {
      id: row.id,
      title: row.title,
      elements: parseSnapshotElements(row.snapshot),
      updatedAt: row.updatedAt.toISOString(),
      lastSeq: latest?.seq ?? 0,
    };
  });

  if (!result) {
    throw new HttpError(404, "BOARD_NOT_FOUND", "Board not found");
  }
  return result;
}

async function createBoard(title: string, userId: string): Promise<BoardSnapshot> {
  const board = await db.$transaction(async (tx) => {
    const created = await tx.board.create({
      data: {
        title,
        snapshot: { elements: [] },
        ownerId: userId,
      },
    });
    await tx.permission.create({
      data: {
        boardId: created.id,
        userId,
        role: PermissionRole.OWNER,
      },
    });
    return created;
  });

  return readSnapshotWithSeq(board.id);
}

async function getBoard(id: string, userId: string): Promise<BoardSnapshot> {
  await requireBoardView(id, userId);
  return readSnapshotWithSeq(id);
}

async function updateBoardTitle(id: string, title: string, userId: string): Promise<BoardSnapshot> {
  await requireBoardEdit(id, userId);
  await db.board.update({ where: { id }, data: { title } });
  return readSnapshotWithSeq(id);
}

async function deleteBoard(id: string, userId: string): Promise<void> {
  await requireBoardOwner(id, userId);
  await db.board.delete({ where: { id } });
}

async function listBoards(userId: string): Promise<BoardListItem[]> {
  const boards = await db.board.findMany({
    where: { permissions: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });

  return boards.map((board) => ({
    id: board.id,
    title: board.title,
    updatedAt: board.updatedAt.toISOString(),
    createdAt: board.createdAt.toISOString(),
  }));
}

export const boardsService = {
  createBoard,
  getBoard,
  updateBoardTitle,
  deleteBoard,
  listBoards,
};
