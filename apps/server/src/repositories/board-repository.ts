import type { Board, Prisma } from "../../prisma/generated/client";
import { prisma } from "../lib/prisma";

export interface CreateBoardInput {
  title: string;
  snapshot: Prisma.InputJsonValue;
  ownerId?: string | null;
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

export async function findBoardById(id: string): Promise<Board | null> {
  return await prisma.board.findUnique({
    where: { id },
  });
}

export async function listBoards(): Promise<Board[]> {
  return await prisma.board.findMany({
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

export async function deleteBoardById(id: string): Promise<Board> {
  return await prisma.board.delete({
    where: { id },
  });
}
