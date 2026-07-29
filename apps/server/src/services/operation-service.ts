import type { WhiteBoardElement, WhiteBoardOperation } from "@whiteboard/shared/types";

import { whiteBoardElementSchema, whiteBoardOperationSchema } from "@whiteboard/shared/schemas";

import { AppError } from "@/lib/app-error";
import { prisma } from "@/lib/prisma";
import { assertCanAccessBoard, assertCanEditBoard } from "@/services/boardsService";

import type { Operation, Prisma } from "../../prisma/generated/client";

interface BoardState {
  elements: WhiteBoardElement[];
}

export interface CommitOperationInput {
  boardId: string;
  operation: WhiteBoardOperation;
  userId: string;
  clientOpId?: string | null;
}

export interface CommittedOperation {
  id: string;
  boardId: string;
  userId: string | null;
  seq: number;
  opType: string;
  elementId: string | null;
  clientOpId: string | null;
  payload: WhiteBoardOperation;
  createdAt: string;
  created: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getElementId(operation: WhiteBoardOperation): string | null {
  switch (operation.type) {
    case "add":
      return operation.element.id;
    case "update":
    case "delete":
      return operation.elementId;
    case "clear":
      return null;
  }
}

function getSnapshotElements(snapshot: unknown): WhiteBoardElement[] {
  if (!isObject(snapshot) || !Array.isArray(snapshot.elements)) {
    return [];
  }

  return snapshot.elements.flatMap((element) => {
    const result = whiteBoardElementSchema.safeParse(element);
    return result.success ? [result.data as WhiteBoardElement] : [];
  });
}

function operationToRecord(operation: Operation, created = true): CommittedOperation {
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

function validateOperationPayload(payload: unknown, expectedBoardId?: string): WhiteBoardOperation {
  const result = whiteBoardOperationSchema.safeParse(payload);
  if (!result.success) {
    throw new AppError(400, "INVALID_OPERATION", "Invalid operation payload");
  }

  if (expectedBoardId && result.data.boardId !== expectedBoardId) {
    throw new AppError(400, "INVALID_OPERATION", "Operation boardId mismatch");
  }

  return result.data as WhiteBoardOperation;
}

function replayOps(snapshot: BoardState, operations: WhiteBoardOperation[]): BoardState {
  const elementsMap: Record<string, WhiteBoardElement> = {};

  snapshot.elements.forEach((element) => {
    elementsMap[element.id] = element;
  });

  operations.forEach((operation) => {
    switch (operation.type) {
      case "add":
        elementsMap[operation.element.id] = operation.element;
        break;

      case "update":
        if (elementsMap[operation.elementId]) {
          elementsMap[operation.elementId] = {
            ...elementsMap[operation.elementId],
            ...operation.changes,
          } as WhiteBoardElement;
        }
        break;

      case "delete":
        delete elementsMap[operation.elementId];
        break;

      case "clear":
        Object.keys(elementsMap).forEach((key) => {
          delete elementsMap[key];
        });
        break;
    }
  });

  return { elements: Object.values(elementsMap) };
}

async function findPersistedOperationsAfter(boardId: string, seq: number): Promise<Operation[]> {
  return await prisma.operation.findMany({
    where: {
      boardId,
      seq: { gt: seq },
    },
    orderBy: { seq: "asc" },
  });
}

async function findOperationByClientOpId(
  boardId: string,
  clientOpId: string,
): Promise<Operation | null> {
  return await prisma.operation.findFirst({
    where: { boardId, clientOpId },
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function persistOperationAtomic(
  input: CommitOperationInput & { operation: WhiteBoardOperation },
): Promise<{ operation: Operation; created: boolean }> {
  try {
    return await prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ id: string; snapshot: unknown }>>`
        SELECT id, snapshot FROM "Board" WHERE id = ${input.boardId} FOR UPDATE
      `;

      const board = locked[0];
      if (!board) {
        throw new AppError(404, "BOARD_NOT_FOUND", "Board not found");
      }

      if (input.clientOpId) {
        const existing = await transaction.operation.findFirst({
          where: { boardId: input.boardId, clientOpId: input.clientOpId },
        });
        if (existing) {
          return { operation: existing, created: false };
        }
      }

      const latest = await transaction.operation.findFirst({
        where: { boardId: input.boardId },
        orderBy: { seq: "desc" },
        select: { seq: true },
      });
      const seq = (latest?.seq ?? 0) + 1;

      const operation = await transaction.operation.create({
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

      const nextState = replayOps({ elements: getSnapshotElements(board.snapshot) }, [
        input.operation,
      ]);
      await transaction.board.update({
        where: { id: input.boardId },
        data: {
          snapshot: { elements: nextState.elements } as unknown as Prisma.InputJsonValue,
        },
      });

      return { operation, created: true };
    });
  } catch (error) {
    if (input.clientOpId && isUniqueConstraintError(error)) {
      const existing = await findOperationByClientOpId(input.boardId, input.clientOpId);
      if (existing) {
        return { operation: existing, created: false };
      }
    }
    throw error;
  }
}

export async function commitOperation(input: CommitOperationInput): Promise<CommittedOperation> {
  const operation = validateOperationPayload(input.operation, input.boardId);
  await assertCanEditBoard(input.boardId, input.userId);

  const result = await persistOperationAtomic({ ...input, operation });
  return operationToRecord(result.operation, result.created);
}

export async function getOperationsAfter(
  boardId: string,
  fromSeq: number,
  userId: string,
): Promise<CommittedOperation[]> {
  await assertCanAccessBoard(boardId, userId);
  const operations = await findPersistedOperationsAfter(boardId, fromSeq);
  return operations.map((operation) => operationToRecord(operation));
}
