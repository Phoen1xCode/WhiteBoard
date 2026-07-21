import { PermissionRole, type Board, type Permission } from "../../prisma/generated/client";
import type { WhiteBoardSnapshot, WhiteBoardElement } from "@whiteboard/shared/types";
import { AppError } from "../lib/app-error";
import * as boardRepository from "../repositories/board-repository";
import { findLatestOperationSeq } from "../repositories/operation-repository";
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

export interface BoardSnapshotWithSeq extends WhiteBoardSnapshot {
  lastSeq: number;
}

async function toWhiteBoardSnapshot(board: Board): Promise<BoardSnapshotWithSeq> {
  const lastSeq = (await findLatestOperationSeq(board.id)) ?? 0;
  return {
    id: board.id,
    title: board.title,
    elements: getSnapshotElements(board.snapshot),
    updatedAt: board.updatedAt.toISOString(),
    lastSeq,
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
    throw new AppError(403, "FORBIDDEN", "No permission to access this board");
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
): Promise<BoardSnapshotWithSeq> {
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
): Promise<BoardSnapshotWithSeq> {
  const board = await assertCanAccessBoard(id, userId);
  return toWhiteBoardSnapshot(board);
}

export async function updateBoardTitle(
  id: string,
  title: string,
  userId: string
): Promise<BoardSnapshotWithSeq> {
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
