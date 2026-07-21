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

export async function findOperationByClientOpId(
  boardId: string,
  clientOpId: string
): Promise<Operation | null> {
  return await prisma.operation.findFirst({
    where: { boardId, clientOpId },
  });
}

/** Atomic seq allocation + insert inside a transaction. Retries unique conflicts. */
export async function createOperationWithNextSeq(
  input: Omit<CreateOperationInput, "seq">,
  maxAttempts = 8
): Promise<Operation> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const latest = await tx.operation.findFirst({
          where: { boardId: input.boardId },
          orderBy: { seq: "desc" },
          select: { seq: true },
        });
        const seq = (latest?.seq ?? 0) + 1;

        return await tx.operation.create({
          data: {
            boardId: input.boardId,
            seq,
            opType: input.opType,
            payload: input.payload,
            userId: input.userId ?? null,
            elementId: input.elementId ?? null,
            clientOpId: input.clientOpId ?? null,
          },
        });
      });
    } catch (error) {
      lastError = error;
      if (isUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to allocate operation seq");
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
