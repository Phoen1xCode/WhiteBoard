import { z } from "zod";

import { whiteBoardSnapshotSchema } from "./whiteboard";

export const createBoardBodySchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
  })
  .default({ title: undefined });

export type CreateBoardInput = z.infer<typeof createBoardBodySchema>;

export const updateBoardTitleBodySchema = z.object({
  title: z.string().min(1).max(100),
});

export type UpdateBoardTitleInput = z.infer<typeof updateBoardTitleBodySchema>;

export const boardIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type BoardIdParams = z.infer<typeof boardIdParamsSchema>;

export const boardListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type BoardListItem = z.infer<typeof boardListItemSchema>;

export const boardSnapshotSchema = whiteBoardSnapshotSchema.extend({
  lastSeq: z.number().int().min(0),
});

export type BoardSnapshot = z.infer<typeof boardSnapshotSchema>;
