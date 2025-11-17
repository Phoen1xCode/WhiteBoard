import { prisma } from "../prisma/client";
import type { WhiteBoardSnapshot } from "@whiteboard/shared/types";

export async function createBoard(title: string): Promise<WhiteBoardSnapshot> {
  const result = await prisma.board.create({
    data: {
      title,
      snapshot: { elements: [] },
    },
  });

  return {
    id: result.id,
    title: result.title,
    elements: (result.snapshot as any).elements ?? [],
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function getBoard(id: string): Promise<WhiteBoardSnapshot | null> {
  const result = await prisma.board.findUnique({
    where: { id },
  });

  return {
    id: result.id,
    title: result.title,
    elements: (result.snapshot as any).elements ?? [],
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function updateBoard(id: string, snapshot: any) {
  return await prisma.board.update({
    where: { id },
    data: { snapshot },
  });
}

export async function deleteBoard(id: string) {
  return await prisma.board.delete({
    where: { id },
  });
}

export async function listBoards() {
  return await prisma.board.findMany({
    orderBy: { updatedAt: "desc" },
  });
}
