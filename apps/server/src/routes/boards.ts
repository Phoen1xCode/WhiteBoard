import { zValidator } from "@hono/zod-validator";
import {
  boardIdParamsSchema,
  createBoardBodySchema,
  updateBoardTitleBodySchema,
} from "@whiteboard/shared/schemas";

import { validationError } from "@/lib/errors";
import { createRouter } from "@/lib/hono";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/middleware/auth";
import { boardsService } from "@/services/boards";

const createBoardRateLimit = rateLimit({
  keyPrefix: "rate:user:board:create",
  limit: 20,
  windowMs: 60_000,
  keyGenerator: (c) => c.get("user")?.id ?? getClientIp(c),
});

const router = createRouter();

router.use("/api/v1/boards", requireAuth);
router.use("/api/v1/boards/*", requireAuth);
router.post("/api/v1/boards", createBoardRateLimit);

export const boardsRoutes = router
  .get("/api/v1/boards", async (c) => {
    return c.json(await boardsService.listBoards(c.get("user").id), 200);
  })
  .post(
    "/api/v1/boards",
    zValidator("json", createBoardBodySchema, (result, c) => {
      if (!result.success) return validationError(c, result.error);
    }),
    async (c) => {
      const { title } = c.req.valid("json");
      return c.json(
        await boardsService.createBoard(title ?? "Untitled Board", c.get("user").id),
        201,
      );
    },
  )
  .get(
    "/api/v1/boards/:id",
    zValidator("param", boardIdParamsSchema, (result, c) => {
      if (!result.success) return validationError(c, result.error);
    }),
    async (c) => {
      return c.json(await boardsService.getBoard(c.req.valid("param").id, c.get("user").id), 200);
    },
  )
  .patch(
    "/api/v1/boards/:id",
    zValidator("param", boardIdParamsSchema, (result, c) => {
      if (!result.success) return validationError(c, result.error);
    }),
    zValidator("json", updateBoardTitleBodySchema, (result, c) => {
      if (!result.success) return validationError(c, result.error);
    }),
    async (c) => {
      return c.json(
        await boardsService.updateBoardTitle(
          c.req.valid("param").id,
          c.req.valid("json").title,
          c.get("user").id,
        ),
        200,
      );
    },
  )
  .delete(
    "/api/v1/boards/:id",
    zValidator("param", boardIdParamsSchema, (result, c) => {
      if (!result.success) return validationError(c, result.error);
    }),
    async (c) => {
      await boardsService.deleteBoard(c.req.valid("param").id, c.get("user").id);
      return c.body(null, 204);
    },
  );
