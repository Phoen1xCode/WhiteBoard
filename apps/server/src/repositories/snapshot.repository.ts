import { prisma } from "../lib/prisma";

export function findLatest(boardId: string) {
  return prisma.snapshot.findFirst({
    where: { boardId },
    orderBy: { seq: "desc" },
  });
}

export function create(data: { boardId: string; seq: number; data: any }) {
  return prisma.snapshot.create({ data });
}
