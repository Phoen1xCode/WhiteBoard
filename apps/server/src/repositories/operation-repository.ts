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

export interface CommitOperationAtomicInput {
  boardId: string;
  opType: string;
  payload: Prisma.InputJsonValue;
  userId?: string | null;
  elementId?: string | null;
  clientOpId?: string | null;
  buildNextSnapshot: (currentSnapshot: unknown) => Prisma.InputJsonValue;
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

/**
 * Lock board row, allocate seq, insert op, update snapshot in one transaction.
 * clientOpId conflicts (P2002) resolve by returning the existing row.
 */
export async function commitOperationAtomic(
  input: CommitOperationAtomicInput
): Promise<Operation> {
  try {
    return await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; snapshot: unknown }>>`
        SELECT id, snapshot FROM "Board" WHERE id = ${input.boardId} FOR UPDATE
      `;

      const board = locked[0];
      if (!board) {
        throw new Error(`Board ${input.boardId} not found`);
      }

      if (input.clientOpId) {
        const existing = await tx.operation.findFirst({
          where: { boardId: input.boardId, clientOpId: input.clientOpId },
        });
        if (existing) {
          return existing;
        }
      }

      const latest = await tx.operation.findFirst({
        where: { boardId: input.boardId },
        orderBy: { seq: "desc" },
        select: { seq: true },
      });
      const seq = (latest?.seq ?? 0) + 1;

      const operation = await tx.operation.create({
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

      await tx.board.update({
        where: { id: input.boardId },
        data: { snapshot: input.buildNextSnapshot(board.snapshot) },
      });

      return operation;
    });
  } catch (error) {
    if (input.clientOpId && isUniqueConstraintError(error)) {
      const existing = await findOperationByClientOpId(input.boardId, input.clientOpId);
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
