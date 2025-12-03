import { prisma } from "../prisma/client";
import type {
  WhiteBoardSnapshot,
  WhiteBoardOperation,
  WhiteBoardElement,
} from "@whiteboard/shared/types";

// 创建新的白板
export async function createBoard(title: string): Promise<WhiteBoardSnapshot> {
  const result = await prisma.board.create({
    data: {
      title,
      snapshot: { elements: [] },
    },
  });

  return {
    id: result.id,
    title: result.title,
    elements: (result.snapshot as any).elements ?? [],
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function getBoard(id: string): Promise<WhiteBoardSnapshot | null> {
  const result = await prisma.board.findUnique({
    where: { id },
  });

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    title: result.title,
    elements: (result.snapshot as any).elements ?? [],
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function updateBoard(id: string, snapshot: any) {
  return await prisma.board.update({
    where: { id },
    data: { snapshot },
  });
}

export async function deleteBoard(id: string) {
  return await prisma.board.delete({
    where: { id },
  });
}

export async function listBoards() {
  return await prisma.board.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

// 应用操作到数据库中的 snapshot
export async function applyOperationToSnapshot(
  boardId: string,
  operation: WhiteBoardOperation
): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    throw new Error(`Board ${boardId} not found`);
  }

  const snapshot = board.snapshot as any;
  const elements = (snapshot?.elements || []) as WhiteBoardElement[];

  // 将 elements 数组转换为 Record 以便操作
  const elementsMap: Record<string, any> = {};
  elements.forEach((el) => {
    elementsMap[el.id] = el;
  });

  // 应用操作
  switch (operation.type) {
    case "add":
      elementsMap[operation.element.id] = operation.element;
      break;

    case "update":
      if (elementsMap[operation.elementId]) {
        elementsMap[operation.elementId] = {
          ...elementsMap[operation.elementId],
          ...operation.changes,
        };
      }
      break;

    case "delete":
      delete elementsMap[operation.elementId];
      break;

    case "clear":
      // 清空所有元素
      Object.keys(elementsMap).forEach((key) => {
        delete elementsMap[key];
      });
      break;
  }

  // 转换回数组并保存
  const updatedElements = Object.values(elementsMap);
  await prisma.board.update({
    where: { id: boardId },
    data: {
      snapshot: { elements: updatedElements } as any,
    },
  });
}
