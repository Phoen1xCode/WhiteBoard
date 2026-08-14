import { z } from "zod";

import { authenticatedUserSchema, type AuthenticatedUser } from "./auth";
import { whiteBoardOperationSchema, type WhiteBoardOperation } from "./whiteboard";

export type SocketUser = AuthenticatedUser;

export const boardJoinSchema = z.object({
  boardId: z.string().min(1),
});

export type BoardJoinPayload = z.infer<typeof boardJoinSchema>;

export const boardLeaveSchema = z.object({
  boardId: z.string().min(1),
});

export type BoardLeavePayload = z.infer<typeof boardLeaveSchema>;

export const cursorUpdateSchema = z.object({
  boardId: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

export type CursorUpdatePayload = z.infer<typeof cursorUpdateSchema>;

export const operationCommitSchema = z.object({
  boardId: z.string().min(1),
  operation: whiteBoardOperationSchema,
  clientOpId: z.string().min(1).optional(),
});

export type OperationCommitPayload = Omit<z.infer<typeof operationCommitSchema>, "operation"> & {
  operation: WhiteBoardOperation;
};

export const operationReplaySchema = z.object({
  boardId: z.string().min(1),
  fromSeq: z.number().int().min(0),
});

export type OperationReplayPayload = z.infer<typeof operationReplaySchema>;

export const boardJoinedSchema = z.object({
  boardId: z.string().min(1),
  user: authenticatedUserSchema,
  members: z.array(authenticatedUserSchema),
});

export type BoardJoinedPayload = z.infer<typeof boardJoinedSchema>;

export const boardUserJoinedSchema = z.object({
  boardId: z.string().min(1),
  user: authenticatedUserSchema,
});

export type BoardUserJoinedPayload = z.infer<typeof boardUserJoinedSchema>;

export const boardUserLeftSchema = z.object({
  boardId: z.string().min(1),
  userId: z.string(),
  socketId: z.string(),
});

export type BoardUserLeftPayload = z.infer<typeof boardUserLeftSchema>;

export const cursorUpdatedSchema = z.object({
  boardId: z.string().min(1),
  userId: z.string(),
  username: z.string(),
  socketId: z.string(),
  x: z.number(),
  y: z.number(),
});

export type CursorUpdatedPayload = z.infer<typeof cursorUpdatedSchema>;

export const committedOperationSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  userId: z.string().nullable(),
  seq: z.number().int(),
  opType: z.string(),
  elementId: z.string().nullable(),
  clientOpId: z.string().nullable(),
  payload: whiteBoardOperationSchema,
  createdAt: z.iso.datetime(),
});

export type CommittedOperationPayload = Omit<
  z.infer<typeof committedOperationSchema>,
  "payload"
> & {
  payload: WhiteBoardOperation;
};

export const operationAckSchema = z.object({
  ok: z.literal(true),
  clientOpId: z.string().nullable(),
  seq: z.number().int(),
  serverTime: z.iso.datetime(),
  operation: committedOperationSchema,
});

export type OperationAckPayload = Omit<z.infer<typeof operationAckSchema>, "operation"> & {
  operation: CommittedOperationPayload;
};

export const operationReplayResultSchema = z.object({
  boardId: z.string(),
  fromSeq: z.number().int(),
  operations: z.array(committedOperationSchema),
});

export type OperationReplayResultPayload = Omit<
  z.infer<typeof operationReplayResultSchema>,
  "operations"
> & {
  operations: CommittedOperationPayload[];
};

export const socketErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryAfterMs: z.number().int().optional(),
});

export type SocketErrorPayload = z.infer<typeof socketErrorSchema>;

export const ackErrorSchema = z.object({
  ok: z.literal(false),
  error: socketErrorSchema,
});

export type AckError = z.infer<typeof ackErrorSchema>;

export type AckResult<T> = ({ ok: true } & T) | AckError;
