import { createRoute } from "@hono/zod-openapi";
import {
  createBoardBodySchema,
  updateBoardTitleBodySchema,
  whiteBoardElementSchema,
} from "@whiteboard/shared/schemas";
import { z } from "zod";

import { createRouter } from "@/lib/hono";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/middleware/auth";
import { bearerSecurity, errorSchema, jsonContent, jsonContentRequired } from "@/routes/openapi";
import { boardsService } from "@/services/boards";

const tags = ["Boards"];

const boardParamsSchema = z.object({
  id: z.string().min(1),
});

const boardListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const boardSnapshotSchema = z.object({
  id: z.string(),
  title: z.string(),
  elements: z.array(whiteBoardElementSchema),
  updatedAt: z.iso.datetime(),
  lastSeq: z.number().int().min(0),
});

const listRoute = createRoute({
  method: "get",
  path: "/api/v1/boards",
  tags,
  security: bearerSecurity,
  responses: {
    200: jsonContent(z.array(boardListItemSchema), "Boards available to the current user"),
    401: jsonContent(errorSchema, "Unauthorized"),
  },
});

const createBoardRoute = createRoute({
  method: "post",
  path: "/api/v1/boards",
  tags,
  security: bearerSecurity,
  request: {
    body: jsonContentRequired(createBoardBodySchema, "Board to create"),
  },
  responses: {
    201: jsonContent(boardSnapshotSchema, "Created board"),
    400: jsonContent(errorSchema, "Validation error"),
    401: jsonContent(errorSchema, "Unauthorized"),
    429: jsonContent(errorSchema, "Rate limited"),
  },
});

const getBoardRoute = createRoute({
  method: "get",
  path: "/api/v1/boards/{id}",
  tags,
  security: bearerSecurity,
  request: { params: boardParamsSchema },
  responses: {
    200: jsonContent(boardSnapshotSchema, "Requested board"),
    401: jsonContent(errorSchema, "Unauthorized"),
    403: jsonContent(errorSchema, "Forbidden"),
    404: jsonContent(errorSchema, "Board not found"),
  },
});

const updateBoardRoute = createRoute({
  method: "patch",
  path: "/api/v1/boards/{id}",
  tags,
  security: bearerSecurity,
  request: {
    params: boardParamsSchema,
    body: jsonContentRequired(updateBoardTitleBodySchema, "Board title update"),
  },
  responses: {
    200: jsonContent(boardSnapshotSchema, "Updated board"),
    400: jsonContent(errorSchema, "Validation error"),
    401: jsonContent(errorSchema, "Unauthorized"),
    403: jsonContent(errorSchema, "Forbidden"),
    404: jsonContent(errorSchema, "Board not found"),
  },
});

const deleteBoardRoute = createRoute({
  method: "delete",
  path: "/api/v1/boards/{id}",
  tags,
  security: bearerSecurity,
  request: { params: boardParamsSchema },
  responses: {
    204: { description: "Board deleted" },
    401: jsonContent(errorSchema, "Unauthorized"),
    403: jsonContent(errorSchema, "Forbidden"),
    404: jsonContent(errorSchema, "Board not found"),
  },
});

const createBoardRateLimit = rateLimit({
  keyPrefix: "rate:user:board:create",
  limit: 20,
  windowMs: 60_000,
  keyGenerator: (c) => c.get("user")?.id ?? getClientIp(c),
});

const router = createRouter();

router.use(listRoute.getRoutingPath(), requireAuth);
router.use("/api/v1/boards/*", requireAuth);
router.post(createBoardRoute.getRoutingPath(), createBoardRateLimit);

export const boardsRoutes = router
  .openapi(listRoute, async (c) => {
    return c.json(await boardsService.listBoards(c.get("user").id), 200);
  })
  .openapi(createBoardRoute, async (c) => {
    const { title } = c.req.valid("json");
    return c.json(
      await boardsService.createBoard(title ?? "Untitled Board", c.get("user").id),
      201,
    );
  })
  .openapi(getBoardRoute, async (c) => {
    return c.json(await boardsService.getBoard(c.req.valid("param").id, c.get("user").id), 200);
  })
  .openapi(updateBoardRoute, async (c) => {
    return c.json(
      await boardsService.updateBoardTitle(
        c.req.valid("param").id,
        c.req.valid("json").title,
        c.get("user").id,
      ),
      200,
    );
  })
  .openapi(deleteBoardRoute, async (c) => {
    await boardsService.deleteBoard(c.req.valid("param").id, c.get("user").id);
    return c.body(null, 204);
  });
