import type { Operation, Prisma } from "../../prisma/generated/client";
import { prisma } from "../lib/prisma";

export interface CreateOperationInput {
  boardId: string;
  seq: number;
  opType: string;
  payload: Prisma.InputJsonValue;
  userId?: string | null;
  elementId?: string | null;
  clientOpId?: string | null;
}

export async function createOperation(input: CreateOperationInput): Promise<Operation> {
  return await prisma.operation.create({
    data: {
      boardId: input.boardId,
      seq: input.seq,
      opType: input.opType,
      payload: input.payload,
      userId: input.userId ?? null,
      elementId: input.elementId ?? null,
      clientOpId: input.clientOpId ?? null,
    },
  });
}

export async function findOperationsAfter(
  boardId: string,
  seq: number
): Promise<Operation[]> {
  return await prisma.operation.findMany({
    where: {
      boardId,
      seq: { gt: seq },
    },
    orderBy: { seq: "asc" },
  });
}

export async function findLatestOperationSeq(boardId: string): Promise<number | null> {
  const operation = await prisma.operation.findFirst({
    where: { boardId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });

  return operation?.seq ?? null;
}
