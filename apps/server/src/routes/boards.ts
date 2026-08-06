import { Hono } from "hono";
import { createBoardBodySchema, updateBoardTitleBodySchema } from "@whiteboard/shared/schemas";

import * as boards from "@/boards";
import { ok } from "@/lib/api-envelope";
import { authMiddleware } from "@/middleware/auth";
import { getClientIp, rateLimit } from "@/middleware/rate-limit";
import { validateBody } from "@/middleware/validate";

const createBoardRateLimit = rateLimit({
  keyPrefix: "rate:user:board:create",
  limit: 20,
  windowMs: 60_000,
  keyGenerator: (c) => c.get("user")?.id ?? getClientIp(c),
});

export function createBoardsRouter(): Hono {
  const router = new Hono();

  router.get("/api/v1/boards", authMiddleware, async (c) => {
    return c.json(ok(await boards.listBoards(c.get("user").id)));
  });

  router.post(
    "/api/v1/boards",
    authMiddleware,
    createBoardRateLimit,
    validateBody(createBoardBodySchema),
    async (c) => {
      const { title } = c.req.valid("json");
      return c.json(ok(await boards.createBoard(title ?? "Untitled Board", c.get("user").id)), 201);
    },
  );

  router.get("/api/v1/boards/:id", authMiddleware, async (c) => {
    return c.json(ok(await boards.getBoard(c.req.param("id"), c.get("user").id)));
  });

  router.patch(
    "/api/v1/boards/:id",
    authMiddleware,
    validateBody(updateBoardTitleBodySchema),
    async (c) => {
      const { title } = c.req.valid("json");
      return c.json(
        ok(await boards.updateBoardTitle(c.req.param("id"), title, c.get("user").id)),
      );
    },
  );

  router.delete("/api/v1/boards/:id", authMiddleware, async (c) => {
    await boards.deleteBoard(c.req.param("id"), c.get("user").id);
    return c.body(null, 204);
  });

  return router;
}
