import { PermissionRole, type Board, type Permission, type Prisma } from "../../prisma/generated/client";
import type {
  WhiteBoardSnapshot,
  WhiteBoardOperation,
  WhiteBoardElement,
} from "@whiteboard/shared/types";
import { AppError } from "../lib/app-error";
import * as boardRepository from "../repositories/board-repository";
import { findPermission } from "../repositories/permission-repository";

interface SnapshotValue {
  elements?: unknown;
}

function getSnapshotElements(snapshot: unknown): WhiteBoardElement[] {
  if (!snapshot || typeof snapshot !== "object" || !("elements" in snapshot)) {
    return [];
  }

  const elements = (snapshot as SnapshotValue).elements;

  if (!Array.isArray(elements)) {
    return [];
  }

  return elements as WhiteBoardElement[];
}

function toWhiteBoardSnapshot(board: Board): WhiteBoardSnapshot {
  return {
    id: board.id,
    title: board.title,
    elements: getSnapshotElements(board.snapshot),
    updatedAt: board.updatedAt.toISOString(),
  };
}

function isEditRole(role: PermissionRole): boolean {
  return role === PermissionRole.OWNER || role === PermissionRole.EDITOR;
}

async function findBoardPermission(
  boardId: string,
  userId: string
): Promise<{ board: Board; permission: Permission }> {
  const board = await boardRepository.findBoardById(boardId);

  if (!board) {
    throw new AppError(404, "BOARD_NOT_FOUND", "Board not found");
  }

  const permission = await findPermission(boardId, userId);

  if (!permission) {
    throw new AppError(404, "BOARD_NOT_FOUND", "Board not found");
  }

  return { board, permission };
}

export async function assertCanAccessBoard(boardId: string, userId: string): Promise<Board> {
  const { board } = await findBoardPermission(boardId, userId);
  return board;
}

export async function assertCanEditBoard(boardId: string, userId: string): Promise<Board> {
  const { board, permission } = await findBoardPermission(boardId, userId);

  if (!isEditRole(permission.role)) {
    throw new AppError(403, "FORBIDDEN", "Editor permission is required");
  }

  return board;
}

async function requireOwnerPermission(boardId: string, userId: string): Promise<Board> {
  const { board, permission } = await findBoardPermission(boardId, userId);

  if (permission.role !== PermissionRole.OWNER) {
    throw new AppError(403, "FORBIDDEN", "Owner permission is required");
  }

  return board;
}

export async function createBoard(
  title: string,
  userId: string
): Promise<WhiteBoardSnapshot> {
  const result = await boardRepository.createBoardWithOwner({
    title,
    snapshot: { elements: [] },
    ownerId: userId,
  });

  return toWhiteBoardSnapshot(result);
}

export async function getBoard(
  id: string,
  userId: string
): Promise<WhiteBoardSnapshot> {
  const board = await assertCanAccessBoard(id, userId);
  return toWhiteBoardSnapshot(board);
}

export async function updateBoard(
  id: string,
  snapshot: Prisma.InputJsonValue,
  userId: string
): Promise<Board> {
  await assertCanEditBoard(id, userId);
  return await boardRepository.updateBoardSnapshot(id, snapshot);
}

export async function updateBoardTitle(
  id: string,
  title: string,
  userId: string
): Promise<WhiteBoardSnapshot> {
  await assertCanEditBoard(id, userId);
  const board = await boardRepository.updateBoardTitle(id, title);
  return toWhiteBoardSnapshot(board);
}

export async function deleteBoard(id: string, userId: string): Promise<Board> {
  await requireOwnerPermission(id, userId);
  return await boardRepository.deleteBoardById(id);
}

export async function listBoards(userId: string): Promise<Board[]> {
  return await boardRepository.listBoardsByUserId(userId);
}

export async function applyOperationToSnapshot(
  boardId: string,
  operation: WhiteBoardOperation,
  userId?: string
): Promise<void> {
  const board = userId
    ? await assertCanEditBoard(boardId, userId)
    : await boardRepository.findBoardById(boardId);

  if (!board) {
    throw new Error(`Board ${boardId} not found`);
  }

  const elements = getSnapshotElements(board.snapshot);
  const elementsMap: Record<string, WhiteBoardElement> = {};

  elements.forEach((element) => {
    elementsMap[element.id] = element;
  });

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

  const updatedElements = Object.values(elementsMap);
  await boardRepository.updateBoardSnapshot(boardId, {
    elements: updatedElements,
  } as unknown as Prisma.InputJsonValue);
}
