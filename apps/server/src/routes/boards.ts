import type { Context } from "koa";

import Router from "@koa/router";
import { createBoardBodySchema, updateBoardTitleBodySchema } from "@whiteboard/shared/schemas";

import * as boardsController from "../controllers/boardsController";
import { authMiddleware } from "../middleware/auth";
import { getClientIp, rateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";

function getBoardCreateRateLimitKey(ctx: Context): string {
  return ctx.state.user?.id ?? getClientIp(ctx);
}

const createBoardRateLimit = rateLimit({
  keyPrefix: "rate:user:board:create",
  limit: 20,
  windowMs: 60_000,
  keyGenerator: getBoardCreateRateLimitKey,
});

export function createBoardsRouter(): Router {
  const router = new Router();

  router.get("/api/v1/boards", authMiddleware, boardsController.listBoards);
  router.post(
    "/api/v1/boards",
    authMiddleware,
    createBoardRateLimit,
    validateBody(createBoardBodySchema),
    boardsController.createBoard,
  );
  router.get("/api/v1/boards/:id", authMiddleware, boardsController.getBoard);
  router.patch(
    "/api/v1/boards/:id",
    authMiddleware,
    validateBody(updateBoardTitleBodySchema),
    boardsController.updateBoardTitle,
  );
  router.delete("/api/v1/boards/:id", authMiddleware, boardsController.deleteBoard);

  return router;
}
