import type { Context } from "koa";

import type { AuthenticatedUser } from "../types/auth";

import { AppError } from "../lib/app-error";
import * as boardsService from "../services/boardsService";

interface CreateBoardBody {
  title?: string;
}

interface UpdateBoardBody {
  title: string;
}

interface RequestWithBody<TBody> {
  body: TBody;
}

function getAuthenticatedUser(ctx: Context): AuthenticatedUser {
  const user = ctx.state.user;

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return user;
}

function getRequestBody<TBody>(ctx: Context): TBody {
  return (ctx.request as typeof ctx.request & RequestWithBody<TBody>).body;
}

export async function createBoard(ctx: Context): Promise<void> {
  const user = getAuthenticatedUser(ctx);
  const body = getRequestBody<CreateBoardBody>(ctx);
  const board = await boardsService.createBoard(body.title ?? "Untitled Board", user.id);
  ctx.body = board;
}

export async function getBoard(ctx: Context): Promise<void> {
  const user = getAuthenticatedUser(ctx);
  const { id } = ctx.params;
  const board = await boardsService.getBoard(id, user.id);
  ctx.body = board;
}

export async function updateBoardTitle(ctx: Context): Promise<void> {
  const user = getAuthenticatedUser(ctx);
  const { id } = ctx.params;
  const body = getRequestBody<UpdateBoardBody>(ctx);
  const board = await boardsService.updateBoardTitle(id, body.title, user.id);
  ctx.body = board;
}

export async function listBoards(ctx: Context): Promise<void> {
  const user = getAuthenticatedUser(ctx);
  const boards = await boardsService.listBoards(user.id);
  ctx.body = boards.map((board) => ({
    id: board.id,
    title: board.title,
    updatedAt: board.updatedAt.toISOString(),
    createdAt: board.createdAt.toISOString(),
  }));
}

export async function deleteBoard(ctx: Context): Promise<void> {
  const user = getAuthenticatedUser(ctx);
  const { id } = ctx.params;
  await boardsService.deleteBoard(id, user.id);
  ctx.status = 204;
}
