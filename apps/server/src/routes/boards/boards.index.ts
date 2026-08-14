import type { AuthMiddleware } from "@/middlewares/auth";
import type { BoardsService } from "@/services/boards.service";

import { createRouter } from "@/lib/create-app";
import { getClientIp, rateLimit } from "@/shared/rate-limit";

import { createBoardsHandlers } from "./boards.handlers";
import * as routes from "./boards.routes";

const createBoardRateLimit = rateLimit({
  keyPrefix: "rate:user:board:create",
  limit: 20,
  windowMs: 60_000,
  keyGenerator: (c) => c.get("user")?.id ?? getClientIp(c),
});

export function createBoardsRouter({
  boardsService,
  authMiddleware,
}: {
  boardsService: BoardsService;
  authMiddleware: AuthMiddleware;
}) {
  const router = createRouter();
  const handlers = createBoardsHandlers(boardsService);

  router.use(routes.list.getRoutingPath(), authMiddleware);
  router.use("/api/v1/boards/*", authMiddleware);
  router.post(routes.create.getRoutingPath(), createBoardRateLimit);

  return router
    .openapi(routes.list, handlers.list)
    .openapi(routes.create, handlers.create)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.update, handlers.update)
    .openapi(routes.remove, handlers.remove);
}
