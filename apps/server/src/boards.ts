import type { WhiteBoardElement, WhiteBoardSnapshot } from "@whiteboard/shared/types";

import { requireEdit, requireOwner, requireView } from "@/board-access";
import { parseSnapshotElements } from "@/board-state";
import { AppError } from "@/lib/app-error";
import { prisma } from "@/lib/prisma";

import { PermissionRole, type Board } from "../prisma/generated/client";

export interface BoardSnapshotWithSeq extends WhiteBoardSnapshot {
  lastSeq: number;
}

export interface BoardListItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

async function readSnapshotWithSeq(boardId: string): Promise<BoardSnapshotWithSeq> {
  const result = await prisma.$transaction(async (tx) => {
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
      elements: parseSnapshotElements(row.snapshot) as WhiteBoardElement[],
      updatedAt: row.updatedAt.toISOString(),
      lastSeq: latest?.seq ?? 0,
    };
  });

  if (!result) {
    throw new AppError(404, "BOARD_NOT_FOUND", "Board not found");
  }
  return result;
}

export async function createBoard(title: string, userId: string): Promise<BoardSnapshotWithSeq> {
  const board = await prisma.$transaction(async (tx) => {
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

export async function getBoard(id: string, userId: string): Promise<BoardSnapshotWithSeq> {
  await requireView(id, userId);
  return readSnapshotWithSeq(id);
}

export async function updateBoardTitle(
  id: string,
  title: string,
  userId: string,
): Promise<BoardSnapshotWithSeq> {
  await requireEdit(id, userId);
  await prisma.board.update({ where: { id }, data: { title } });
  return readSnapshotWithSeq(id);
}

export async function deleteBoard(id: string, userId: string): Promise<Board> {
  await requireOwner(id, userId);
  return prisma.board.delete({ where: { id } });
}

export async function listBoards(userId: string): Promise<BoardListItem[]> {
  const boards = await prisma.board.findMany({
    where: { permissions: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
  });

  return boards.map((board) => ({
    id: board.id,
    title: board.title,
    updatedAt: board.updatedAt.toISOString(),
    createdAt: board.createdAt.toISOString(),
  }));
}
