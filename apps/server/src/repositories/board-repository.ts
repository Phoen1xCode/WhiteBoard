import { PermissionRole, type Board, type Prisma } from "../../prisma/generated/client";
import { prisma } from "../lib/prisma";

export interface CreateBoardInput {
  title: string;
  snapshot: Prisma.InputJsonValue;
  ownerId?: string | null;
}

export interface CreateOwnedBoardInput {
  title: string;
  snapshot: Prisma.InputJsonValue;
  ownerId: string;
}

export async function createBoard(input: CreateBoardInput): Promise<Board> {
  return await prisma.board.create({
    data: {
      title: input.title,
      snapshot: input.snapshot,
      ownerId: input.ownerId ?? null,
    },
  });
}

export async function createBoardWithOwner(input: CreateOwnedBoardInput): Promise<Board> {
  return await prisma.$transaction(async (transaction) => {
    const board = await transaction.board.create({
      data: {
        title: input.title,
        snapshot: input.snapshot,
        ownerId: input.ownerId,
      },
    });

    await transaction.permission.create({
      data: {
        boardId: board.id,
        userId: input.ownerId,
        role: PermissionRole.OWNER,
      },
    });

    return board;
  });
}

export async function findBoardById(id: string): Promise<Board | null> {
  return await prisma.board.findUnique({
    where: { id },
  });
}

/** Read snapshot + max(seq) under one row lock so lastSeq always matches snapshot. */
export async function findBoardSnapshotWithSeq(
  boardId: string
): Promise<{ board: Board; lastSeq: number } | null> {
  return await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      Array<{
        id: string;
        title: string;
        snapshot: unknown;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >`
      SELECT id, title, snapshot, "ownerId", "createdAt", "updatedAt"
      FROM "Board"
      WHERE id = ${boardId}
      FOR SHARE
    `;

    const row = locked[0];
    if (!row) {
      return null;
    }

    const latest = await tx.operation.findFirst({
      where: { boardId },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });

    return {
      board: {
        id: row.id,
        title: row.title,
        snapshot: row.snapshot as Board["snapshot"],
        ownerId: row.ownerId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      lastSeq: latest?.seq ?? 0,
    };
  });
}

export async function listBoards(): Promise<Board[]> {
  return await prisma.board.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function listBoardsByUserId(userId: string): Promise<Board[]> {
  return await prisma.board.findMany({
    where: {
      permissions: {
        some: { userId },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateBoardSnapshot(
  id: string,
  snapshot: Prisma.InputJsonValue
): Promise<Board> {
  return await prisma.board.update({
    where: { id },
    data: { snapshot },
  });
}

export async function updateBoardTitle(id: string, title: string): Promise<Board> {
  return await prisma.board.update({
    where: { id },
    data: { title },
  });
}

export async function deleteBoardById(id: string): Promise<Board> {
  return await prisma.board.delete({
    where: { id },
  });
}
