import type { Prisma, Snapshot } from "../../prisma/generated/client";

import { prisma } from "../lib/prisma";

export interface CreateSnapshotInput {
  boardId: string;
  seq: number;
  state: Prisma.InputJsonValue;
}

export async function createSnapshot(input: CreateSnapshotInput): Promise<Snapshot> {
  return await prisma.snapshot.create({
    data: input,
  });
}

export async function findLatestSnapshotByBoardId(boardId: string): Promise<Snapshot | null> {
  return await prisma.snapshot.findFirst({
    where: { boardId },
    orderBy: { seq: "desc" },
  });
}

export async function findSnapshotByBoardIdAndSeq(
  boardId: string,
  seq: number,
): Promise<Snapshot | null> {
  return await prisma.snapshot.findUnique({
    where: {
      boardId_seq: {
        boardId,
        seq,
      },
    },
  });
}
