import type { Operation, Prisma } from "@generated/client";
import type { CommittedOperationPayload, WhiteBoardOperation } from "@whiteboard/shared/schemas";

import { whiteBoardOperationSchema } from "@whiteboard/shared/schemas";

import { db } from "@/db";
import { HttpError } from "@/lib/errors";
import { applyOperations, getElementId, parseSnapshotElements } from "@/services/board-state";
import { requireBoardEdit, requireBoardView } from "@/services/boards";

export interface CommitOperationInput {
  boardId: string;
  operation: WhiteBoardOperation;
  userId: string;
  clientOpId?: string | null;
}

export type CommittedOperation = CommittedOperationPayload & { created: boolean };

function validateOperationPayload(payload: unknown, expectedBoardId?: string): WhiteBoardOperation {
  const result = whiteBoardOperationSchema.safeParse(payload);
  if (!result.success) {
    throw new HttpError(400, "INVALID_OPERATION", "Invalid operation payload");
  }
  if (expectedBoardId && result.data.boardId !== expectedBoardId) {
    throw new HttpError(400, "INVALID_OPERATION", "Operation boardId mismatch");
  }
  return result.data as WhiteBoardOperation;
}

function toRecord(operation: Operation, created = true): CommittedOperation {
  return {
    id: operation.id,
    boardId: operation.boardId,
    userId: operation.userId,
    seq: operation.seq,
    opType: operation.opType,
    elementId: operation.elementId,
    clientOpId: operation.clientOpId,
    payload: validateOperationPayload(operation.payload, operation.boardId),
    createdAt: operation.createdAt.toISOString(),
    created,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function persistAtomic(
  input: CommitOperationInput & { operation: WhiteBoardOperation },
): Promise<{ operation: Operation; created: boolean }> {
  try {
    return await db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; snapshot: unknown }>>`
        SELECT id, snapshot FROM "Board" WHERE id = ${input.boardId} FOR UPDATE
      `;
      const board = locked[0];
      if (!board) {
        throw new HttpError(404, "BOARD_NOT_FOUND", "Board not found");
      }

      if (input.clientOpId) {
        const existing = await tx.operation.findFirst({
          where: { boardId: input.boardId, clientOpId: input.clientOpId },
        });
        if (existing) {
          return { operation: existing, created: false };
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
          opType: input.operation.type,
          payload: input.operation as unknown as Prisma.InputJsonValue,
          userId: input.userId,
          elementId: getElementId(input.operation),
          clientOpId: input.clientOpId ?? null,
        },
      });

      const nextState = applyOperations({ elements: parseSnapshotElements(board.snapshot) }, [
        input.operation,
      ]);
      await tx.board.update({
        where: { id: input.boardId },
        data: {
          snapshot: { elements: nextState.elements } as unknown as Prisma.InputJsonValue,
        },
      });

      return { operation, created: true };
    });
  } catch (error) {
    if (input.clientOpId && isUniqueConstraintError(error)) {
      const existing = await db.operation.findFirst({
        where: { boardId: input.boardId, clientOpId: input.clientOpId },
      });
      if (existing) {
        return { operation: existing, created: false };
      }
    }
    throw error;
  }
}

async function commitOperation(input: CommitOperationInput): Promise<CommittedOperation> {
  const operation = validateOperationPayload(input.operation, input.boardId);
  await requireBoardEdit(input.boardId, input.userId);
  const result = await persistAtomic({ ...input, operation });
  return toRecord(result.operation, result.created);
}

async function getOperationsAfter(
  boardId: string,
  fromSeq: number,
  userId: string,
): Promise<CommittedOperation[]> {
  await requireBoardView(boardId, userId);
  const operations = await db.operation.findMany({
    where: { boardId, seq: { gt: fromSeq } },
    orderBy: { seq: "asc" },
  });
  return operations.map((operation) => toRecord(operation));
}

export const operationsService = { commitOperation, getOperationsAfter };
