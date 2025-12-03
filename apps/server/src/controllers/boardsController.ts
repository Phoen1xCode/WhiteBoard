import type { Context } from "koa";
import * as boardsService from "../services/boardsService";

export async function createBoard(ctx: Context) {
  const { title = "Untitled Board" } =
    (ctx.request.body as { title?: string }) || {};
  const board = await boardsService.createBoard(title);
  ctx.body = board;
}

export async function getBoard(ctx: Context) {
  const { id } = ctx.params;
  const board = await boardsService.getBoard(id);
  if (!board) {
    ctx.status = 404;
    ctx.body = { error: "Board not found" };
    return;
  }
  ctx.body = board;
}

export async function listBoards(ctx: Context) {
  const boards = await boardsService.listBoards();
  ctx.body = boards.map((board) => ({
    id: board.id,
    title: board.title,
    updatedAt: board.updatedAt.toISOString(),
    createdAt: board.createdAt.toISOString(),
  }));
}

export async function deleteBoard(ctx: Context) {
  const { id } = ctx.params;
  try {
    await boardsService.deleteBoard(id);
    ctx.status = 204;
  } catch {
    ctx.status = 404;
    ctx.body = { error: "Board not found" };
  }
}
