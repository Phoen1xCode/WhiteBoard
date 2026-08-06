import type { Context } from "hono";

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

function userId(c: Context): string {
  return c.get("user").id;
}

function body<T>(c: Context): T {
  return c.get("body") as T;
}

export function createBoardsRouter(): Hono {
  const router = new Hono();

  router.get("/api/v1/boards", authMiddleware, async (c) => {
    return c.json(ok(await boards.listBoards(userId(c))));
  });

  router.post(
    "/api/v1/boards",
    authMiddleware,
    createBoardRateLimit,
    validateBody(createBoardBodySchema),
    async (c) => {
      const { title } = body<{ title?: string }>(c);
      return c.json(ok(await boards.createBoard(title ?? "Untitled Board", userId(c))), 201);
    },
  );

  router.get("/api/v1/boards/:id", authMiddleware, async (c) => {
    return c.json(ok(await boards.getBoard(c.req.param("id"), userId(c))));
  });

  router.patch(
    "/api/v1/boards/:id",
    authMiddleware,
    validateBody(updateBoardTitleBodySchema),
    async (c) => {
      const { title } = body<{ title: string }>(c);
      return c.json(ok(await boards.updateBoardTitle(c.req.param("id"), title, userId(c))));
    },
  );

  router.delete("/api/v1/boards/:id", authMiddleware, async (c) => {
    await boards.deleteBoard(c.req.param("id"), userId(c));
    return c.body(null, 204);
  });

  return router;
}
