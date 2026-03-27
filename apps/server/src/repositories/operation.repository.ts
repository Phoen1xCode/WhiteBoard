import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";

export function findAfterSeq(boardId: string, seq: number) {
  return prisma.operation.findMany({
    where: { boardId, seq: { gt: seq } },
    orderBy: { seq: "asc" },
  });
}

export function countAfterSeq(boardId: string, seq: number) {
  return prisma.operation.count({
    where: { boardId, seq: { gt: seq } },
  });
}

export function createMany(data: Prisma.OperationCreateManyInput[]) {
  return prisma.operation.createMany({ data });
}

export function deleteOlderThan(
  boardId: string,
  seq: number,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  return prisma.operation.deleteMany({
    where: {
      boardId,
      seq: { lte: seq },
      createdAt: { lt: cutoff },
    },
  });
}
