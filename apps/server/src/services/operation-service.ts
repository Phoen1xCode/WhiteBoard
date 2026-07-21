import type { Operation, Prisma } from "../../prisma/generated/client";
import type {
  WhiteBoardElement,
  WhiteBoardOperation,
  WhiteBoardSnapshot,
} from "@whiteboard/shared/types";
import { AppError } from "../lib/app-error";
import {
  commitOperationAtomic,
  findOperationsAfter,
} from "../repositories/operation-repository";
import { findLatestSnapshotByBoardId } from "../repositories/snapshot-repository";
import { assertCanAccessBoard, assertCanEditBoard } from "./boardsService";

export interface BoardState {
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
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isShapeType(value: unknown): boolean {
  return (
    value === "freehand" ||
    value === "rectangle" ||
    value === "circle" ||
    value === "line" ||
    value === "text" ||
    value === "select" ||
    value === "eraser"
  );
}

function isWhiteBoardElement(value: unknown): value is WhiteBoardElement {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isShapeType(value.type) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.strokeColor === "string" &&
    typeof value.strokeWidth === "number"
  );
}

function isPartialElementChanges(value: unknown): value is Partial<WhiteBoardElement> {
  return isObject(value);
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

  return snapshot.elements.filter(isWhiteBoardElement);
}

function operationToRecord(operation: Operation): CommittedOperation {
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
  };
}

export function validateOperationPayload(
  payload: unknown,
  expectedBoardId?: string
): WhiteBoardOperation {
  if (!isObject(payload) || typeof payload.type !== "string") {
    throw new AppError(400, "INVALID_OPERATION", "Invalid operation payload");
  }

  if (typeof payload.boardId !== "string") {
    throw new AppError(400, "INVALID_OPERATION", "Operation boardId is required");
  }

  if (expectedBoardId && payload.boardId !== expectedBoardId) {
    throw new AppError(400, "INVALID_OPERATION", "Operation boardId mismatch");
  }

  switch (payload.type) {
    case "add":
      if (!isWhiteBoardElement(payload.element)) {
        throw new AppError(400, "INVALID_OPERATION", "Add operation element is invalid");
      }
      return {
        type: "add",
        boardId: payload.boardId,
        element: payload.element,
      };

    case "update":
      if (typeof payload.elementId !== "string" || !isPartialElementChanges(payload.changes)) {
        throw new AppError(400, "INVALID_OPERATION", "Update operation payload is invalid");
      }
      return {
        type: "update",
        boardId: payload.boardId,
        elementId: payload.elementId,
        changes: payload.changes,
      };

    case "delete":
      if (typeof payload.elementId !== "string") {
        throw new AppError(400, "INVALID_OPERATION", "Delete operation elementId is invalid");
      }
      return {
        type: "delete",
        boardId: payload.boardId,
        elementId: payload.elementId,
      };

    case "clear":
      return {
        type: "clear",
        boardId: payload.boardId,
      };

    default:
      throw new AppError(400, "INVALID_OPERATION", "Unsupported operation type");
  }
}

export function replayOps(snapshot: BoardState, operations: WhiteBoardOperation[]): BoardState {
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

export async function commitOperation(
  input: CommitOperationInput
): Promise<CommittedOperation> {
  const operation = validateOperationPayload(input.operation, input.boardId);
  await assertCanEditBoard(input.boardId, input.userId);

  const record = await commitOperationAtomic({
    boardId: input.boardId,
    userId: input.userId,
    opType: operation.type,
    elementId: getElementId(operation),
    clientOpId: input.clientOpId ?? null,
    payload: operation as unknown as Prisma.InputJsonValue,
    buildNextSnapshot: (currentSnapshot) => {
      const nextState = replayOps(
        { elements: getSnapshotElements(currentSnapshot) },
        [operation]
      );
      return { elements: nextState.elements } as unknown as Prisma.InputJsonValue;
    },
  });

  return operationToRecord(record);
}

export async function getOperationsAfter(
  boardId: string,
  fromSeq: number,
  userId: string
): Promise<CommittedOperation[]> {
  await assertCanAccessBoard(boardId, userId);
  const operations = await findOperationsAfter(boardId, fromSeq);
  return operations.map(operationToRecord);
}

export async function replayBoard(
  boardId: string,
  userId: string
): Promise<WhiteBoardSnapshot> {
  const board = await assertCanAccessBoard(boardId, userId);
  const latestSnapshot = await findLatestSnapshotByBoardId(boardId);
  const operations = await findOperationsAfter(boardId, latestSnapshot?.seq ?? 0);
  const operationPayloads = operations.map((operation) =>
    validateOperationPayload(operation.payload, boardId)
  );
  const baseState = latestSnapshot
    ? { elements: getSnapshotElements(latestSnapshot.state) }
    : operations.length > 0
      ? { elements: [] }
      : { elements: getSnapshotElements(board.snapshot) };
  const state = replayOps(baseState, operationPayloads);

  return {
    id: board.id,
    title: board.title,
    elements: state.elements,
    updatedAt: board.updatedAt.toISOString(),
  };
}
