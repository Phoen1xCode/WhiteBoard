import { createRoute } from "@hono/zod-openapi";
import {
  createBoardBodySchema,
  updateBoardTitleBodySchema,
  whiteBoardElementSchema,
} from "@whiteboard/shared/schemas";
import { z } from "zod";

import { bearerSecurity, errorSchema, jsonContent, jsonContentRequired } from "@/lib/open-api";

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

export const list = createRoute({
  method: "get",
  path: "/api/v1/boards",
  tags,
  security: bearerSecurity,
  responses: {
    200: jsonContent(z.array(boardListItemSchema), "Boards available to the current user"),
    401: jsonContent(errorSchema, "Unauthorized"),
  },
});

export const create = createRoute({
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

export const getOne = createRoute({
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

export const update = createRoute({
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

export const remove = createRoute({
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

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
