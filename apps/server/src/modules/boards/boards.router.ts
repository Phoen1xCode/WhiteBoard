import { createBoardBodySchema, updateBoardTitleBodySchema } from "@whiteboard/shared/schemas";
import { Hono } from "hono";

import type { AuthMiddleware } from "@/modules/auth/auth.middleware";
import type { BoardsService } from "@/modules/boards/boards.service";

import { validateBody } from "@/shared/http/validate";
import { getClientIp, rateLimit } from "@/shared/rate-limit";

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
}): Hono {
  const router = new Hono();

  router.get("/api/v1/boards", authMiddleware, async (c) => {
    return c.json(await boardsService.listBoards(c.get("user").id));
  });

  router.post(
    "/api/v1/boards",
    authMiddleware,
    createBoardRateLimit,
    validateBody(createBoardBodySchema),
    async (c) => {
      const { title } = c.req.valid("json");
      return c.json(
        await boardsService.createBoard(title ?? "Untitled Board", c.get("user").id),
        201,
      );
    },
  );

  router.get("/api/v1/boards/:id", authMiddleware, async (c) => {
    return c.json(await boardsService.getBoard(c.req.param("id"), c.get("user").id));
  });

  router.patch(
    "/api/v1/boards/:id",
    authMiddleware,
    validateBody(updateBoardTitleBodySchema),
    async (c) => {
      const { title } = c.req.valid("json");
      return c.json(
        await boardsService.updateBoardTitle(c.req.param("id"), title, c.get("user").id),
      );
    },
  );

  router.delete("/api/v1/boards/:id", authMiddleware, async (c) => {
    await boardsService.deleteBoard(c.req.param("id"), c.get("user").id);
    return c.body(null, 204);
  });

  return router;
}
