import type { Context } from "koa";

import Router from "@koa/router";
import { createBoardBodySchema, updateBoardTitleBodySchema } from "@whiteboard/shared/schemas";

import * as boards from "@/boards";
import { AppError } from "@/lib/app-error";
import { success } from "@/lib/response";
import { authMiddleware } from "@/middleware/auth";
import { getClientIp, rateLimit } from "@/middleware/rate-limit";
import { validateBody } from "@/middleware/validate";

const createBoardRateLimit = rateLimit({
  keyPrefix: "rate:user:board:create",
  limit: 20,
  windowMs: 60_000,
  keyGenerator: (ctx) => ctx.state.user?.id ?? getClientIp(ctx),
});

function userId(ctx: Context): string {
  const id = ctx.state.user?.id;
  if (!id) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return id;
}

function body<T>(ctx: Context): T {
  return (ctx.request as typeof ctx.request & { body: T }).body;
}

export function createBoardsRouter(): Router {
  const router = new Router();

  router.get("/api/v1/boards", authMiddleware, async (ctx) => {
    ctx.body = success(await boards.listBoards(userId(ctx)));
  });

  router.post(
    "/api/v1/boards",
    authMiddleware,
    createBoardRateLimit,
    validateBody(createBoardBodySchema),
    async (ctx) => {
      const { title } = body<{ title?: string }>(ctx);
      ctx.status = 201;
      ctx.body = success(await boards.createBoard(title ?? "Untitled Board", userId(ctx)));
    },
  );

  router.get("/api/v1/boards/:id", authMiddleware, async (ctx) => {
    ctx.body = success(await boards.getBoard(ctx.params.id, userId(ctx)));
  });

  router.patch(
    "/api/v1/boards/:id",
    authMiddleware,
    validateBody(updateBoardTitleBodySchema),
    async (ctx) => {
      const { title } = body<{ title: string }>(ctx);
      ctx.body = success(await boards.updateBoardTitle(ctx.params.id, title, userId(ctx)));
    },
  );

  router.delete("/api/v1/boards/:id", authMiddleware, async (ctx) => {
    await boards.deleteBoard(ctx.params.id, userId(ctx));
    ctx.status = 204;
  });

  return router;
}
