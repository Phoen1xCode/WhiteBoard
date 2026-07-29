import { AppError } from "@/lib/app-error";
import { prisma } from "@/lib/prisma";

import { PermissionRole, type Board } from "../prisma/generated/client";

function isEditRole(role: PermissionRole): boolean {
  return role === PermissionRole.OWNER || role === PermissionRole.EDITOR;
}

async function loadBoardAndRole(
  boardId: string,
  userId: string,
): Promise<{ board: Board; role: PermissionRole }> {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    throw new AppError(404, "BOARD_NOT_FOUND", "Board not found");
  }

  const permission = await prisma.permission.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!permission) {
    throw new AppError(403, "FORBIDDEN", "No permission to access this board");
  }

  return { board, role: permission.role };
}

export async function requireView(boardId: string, userId: string): Promise<Board> {
  const { board } = await loadBoardAndRole(boardId, userId);
  return board;
}

export async function requireEdit(boardId: string, userId: string): Promise<Board> {
  const { board, role } = await loadBoardAndRole(boardId, userId);
  if (!isEditRole(role)) {
    throw new AppError(403, "FORBIDDEN", "Editor permission is required");
  }
  return board;
}

export async function requireOwner(boardId: string, userId: string): Promise<Board> {
  const { board, role } = await loadBoardAndRole(boardId, userId);
  if (role !== PermissionRole.OWNER) {
    throw new AppError(403, "FORBIDDEN", "Owner permission is required");
  }
  return board;
}
