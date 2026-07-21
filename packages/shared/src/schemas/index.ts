import { z } from "zod";

export const shapeTypeSchema = z.enum([
  "freehand",
  "rectangle",
  "circle",
  "line",
  "text",
  "select",
  "eraser",
]);

export const baseElementSchema = z.object({
  id: z.string().min(1),
  type: shapeTypeSchema,
  x: z.number(),
  y: z.number(),
  strokeColor: z.string(),
  strokeWidth: z.number(),
  strokeDashArray: z.array(z.number()).optional(),
});

export const whiteBoardElementSchema = baseElementSchema
  .extend({
    points: z.array(z.number()).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    radius: z.number().optional(),
    fill: z.string().optional(),
  })
  .passthrough();

export const whiteBoardOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("add"),
    boardId: z.string().min(1),
    element: whiteBoardElementSchema,
  }),
  z.object({
    type: z.literal("update"),
    boardId: z.string().min(1),
    elementId: z.string().min(1),
    changes: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("delete"),
    boardId: z.string().min(1),
    elementId: z.string().min(1),
  }),
  z.object({
    type: z.literal("clear"),
    boardId: z.string().min(1),
  }),
]);

export const registerBodySchema = z.object({
  email: z.email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const createBoardBodySchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
  })
  .default({ title: undefined });

export const updateBoardTitleBodySchema = z.object({
  title: z.string().min(1).max(100),
});

export const boardJoinSchema = z.object({
  boardId: z.string().min(1),
});

export const cursorUpdateSchema = z.object({
  boardId: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

export const operationCommitSchema = z.object({
  boardId: z.string().min(1),
  operation: whiteBoardOperationSchema,
  clientOpId: z.string().min(1).optional(),
});

export const operationReplaySchema = z.object({
  boardId: z.string().min(1),
  fromSeq: z.number().int().min(0),
});
