import type { Context } from "koa";
import * as boardsService from "../services/boardsService";

interface CreateBoardBody {
  title?: string;
}

export async function createBoard(ctx: Context) {
  const body = ctx.request.body as CreateBoardBody;
  const title = body?.title || "Untitled Board";
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
