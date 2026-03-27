import * as boardRepo from "../repositories/board.repository";
import * as snapshotRepo from "../repositories/snapshot.repository";
import { getBoardState } from "./operation.service";
import { prisma } from "../lib/prisma";

export class BoardError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BoardError";
  }
}

export async function createBoard(title: string, ownerId: number) {
  const board = await boardRepo.create({ title, ownerId });

  // Create initial empty snapshot at seq 0
  await snapshotRepo.create({
    boardId: board.id,
    seq: 0,
    data: {},
  });

  // Create owner permission
  await prisma.permission.create({
    data: { boardId: board.id, userId: ownerId, role: "owner" },
  });

  return {
    id: board.id,
    title: board.title,
    ownerId: board.ownerId,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}

export async function getBoard(id: string) {
  const board = await boardRepo.findById(id);
  if (!board) throw new BoardError("Board not found", 404);

  const state = await getBoardState(id);

  return {
    id: board.id,
    title: board.title,
    ownerId: board.ownerId,
    elements: state.elements,
    currentSeq: state.currentSeq,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}

export async function listBoards(userId: number) {
  const boards = await boardRepo.findByUserId(userId);
  return boards.map((b) => ({
    id: b.id,
    title: b.title,
    ownerId: b.ownerId,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export async function updateBoard(id: string, data: { title?: string }) {
  const board = await boardRepo.findById(id);
  if (!board) throw new BoardError("Board not found", 404);

  const updated = await boardRepo.update(id, data);
  return {
    id: updated.id,
    title: updated.title,
    ownerId: updated.ownerId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteBoard(id: string) {
  const board = await boardRepo.findById(id);
  if (!board) throw new BoardError("Board not found", 404);
  await boardRepo.remove(id);
}
