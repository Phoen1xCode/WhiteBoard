import type { Permission, PermissionRole } from "../../prisma/generated/client";
import { prisma } from "../lib/prisma";

export interface CreatePermissionInput {
  boardId: string;
  userId: string;
  role: PermissionRole;
}

export async function createPermission(input: CreatePermissionInput): Promise<Permission> {
  return await prisma.permission.create({
    data: input,
  });
}

export async function findPermission(
  boardId: string,
  userId: string
): Promise<Permission | null> {
  return await prisma.permission.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
  });
}

export async function listBoardPermissions(boardId: string): Promise<Permission[]> {
  return await prisma.permission.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
  });
}
