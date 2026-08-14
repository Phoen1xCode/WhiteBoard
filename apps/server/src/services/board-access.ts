import { PermissionRole, type Board, type PrismaClient } from "@prisma/generated/client";

import { ApiError } from "@/shared/api-error";

function isEditRole(role: PermissionRole): boolean {
  return role === PermissionRole.OWNER || role === PermissionRole.EDITOR;
}

export function createBoardAccess({ prisma }: { prisma: PrismaClient }) {
  async function loadBoardAndRole(
    boardId: string,
    userId: string,
  ): Promise<{ board: Board; role: PermissionRole }> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new ApiError(404, "BOARD_NOT_FOUND", "Board not found");
    }

    const permission = await prisma.permission.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    if (!permission) {
      throw new ApiError(403, "FORBIDDEN", "No permission to access this board");
    }

    return { board, role: permission.role };
  }

  async function requireView(boardId: string, userId: string): Promise<Board> {
    const { board } = await loadBoardAndRole(boardId, userId);
    return board;
  }

  async function requireEdit(boardId: string, userId: string): Promise<Board> {
    const { board, role } = await loadBoardAndRole(boardId, userId);
    if (!isEditRole(role)) {
      throw new ApiError(403, "FORBIDDEN", "Editor permission is required");
    }
    return board;
  }

  async function requireOwner(boardId: string, userId: string): Promise<Board> {
    const { board, role } = await loadBoardAndRole(boardId, userId);
    if (role !== PermissionRole.OWNER) {
      throw new ApiError(403, "FORBIDDEN", "Owner permission is required");
    }
    return board;
  }

  return { requireView, requireEdit, requireOwner };
}

export type BoardAccess = ReturnType<typeof createBoardAccess>;
