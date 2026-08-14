import type { WhiteBoardOperation } from "@whiteboard/shared/types";
import type {
  AckResult,
  BoardJoinedPayload,
  OperationAckPayload,
  OperationReplayResultPayload,
} from "@whiteboard/shared/types/socket";
import type { Server, Socket } from "socket.io";

import {
  boardJoinSchema,
  cursorUpdateSchema,
  operationCommitSchema,
  operationReplaySchema,
} from "@whiteboard/shared/schemas";
import { ZodError } from "zod";

import type { AuthenticatedUser } from "@/lib/auth";

import { resolveAccessToken } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { collaboration } from "@/socket/collaboration";
import { boardRoom, presence, userRoom } from "@/socket/presence";

type AuthedSocket = Socket & { data: { user: AuthenticatedUser } };

function errorAck(code: string, message: string, retryAfterMs?: number): AckResult<never> {
  return { ok: false, error: { code, message, retryAfterMs } };
}

function mapError(error: unknown): AckResult<never> {
  if (error instanceof HttpError) {
    return errorAck(error.code, error.message);
  }
  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
      .join("; ");
    return errorAck("VALIDATION_ERROR", message);
  }
  console.error("Socket handler error:", error);
  return errorAck("INTERNAL_SERVER_ERROR", "Internal server error");
}

async function rateLimitOrAck(
  key: string,
  limit: number,
  windowMs: number,
): Promise<AckResult<never> | null> {
  try {
    const result = await checkRateLimit(key, limit, windowMs);
    if (result.allowed) return null;
    return errorAck("RATE_LIMITED", "Too many requests", result.retryAfterMs);
  } catch (error) {
    console.error("Socket rate limit failed:", error);
    return errorAck("RATE_LIMIT_UNAVAILABLE", "Rate limit is unavailable");
  }
}

function extractToken(socket: Socket): string | null {
  if (typeof socket.handshake.auth?.token === "string") {
    return socket.handshake.auth.token;
  }
  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return null;
}

export function registerSocketServer(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        next(new Error("UNAUTHORIZED"));
        return;
      }
      const { user } = await resolveAccessToken(token);
      (socket as AuthedSocket).data.user = user;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (rawSocket: Socket) => {
    const socket = rawSocket as AuthedSocket;
    const user = socket.data.user;
    void socket.join(userRoom(user.id));

    socket.on(
      "board:join",
      async (rawPayload: unknown, ack?: (result: AckResult<BoardJoinedPayload>) => void) => {
        try {
          const payload = boardJoinSchema.parse(rawPayload);
          const joined = await presence.joinBoard({
            boardId: payload.boardId,
            user,
            socketId: socket.id,
          });
          const room = boardRoom(payload.boardId);
          await socket.join(room);
          socket.to(room).emit("board:user-joined", {
            boardId: payload.boardId,
            user: joined.user,
          });
          const response: BoardJoinedPayload = joined;
          ack?.({ ok: true, ...response });
          socket.emit("board:joined", response);
        } catch (error) {
          const result = mapError(error);
          ack?.(result);
          socket.emit("error", result.error);
        }
      },
    );

    socket.on("board:leave", async (rawPayload: unknown) => {
      try {
        const payload = boardJoinSchema.parse(rawPayload);
        const left = presence.leaveBoard({
          boardId: payload.boardId,
          userId: user.id,
          socketId: socket.id,
        });
        await socket.leave(boardRoom(payload.boardId));
        socket.to(boardRoom(payload.boardId)).emit("board:user-left", left);
      } catch (error) {
        socket.emit("error", mapError(error).error);
      }
    });

    socket.on(
      "operation:commit",
      async (rawPayload: unknown, ack?: (result: AckResult<OperationAckPayload>) => void) => {
        try {
          const payload = operationCommitSchema.parse(rawPayload);
          const limited = await rateLimitOrAck(
            `rate:board:${payload.boardId}:user:${user.id}:op`,
            60,
            1_000,
          );
          if (limited) {
            ack?.(limited);
            return;
          }

          const { ack: ackPayload, broadcast } = await collaboration.commitOnBoard({
            boardId: payload.boardId,
            userId: user.id,
            socketId: socket.id,
            operation: payload.operation as WhiteBoardOperation,
            clientOpId: payload.clientOpId ?? null,
          });

          ack?.(ackPayload);
          if (broadcast) {
            socket.to(boardRoom(payload.boardId)).emit("operation:committed", broadcast);
          }
        } catch (error) {
          const result = mapError(error);
          ack?.(result);
          socket.emit("error", result.error);
        }
      },
    );

    socket.on(
      "operation:replay",
      async (
        rawPayload: unknown,
        ack?: (result: AckResult<OperationReplayResultPayload>) => void,
      ) => {
        try {
          const payload = operationReplaySchema.parse(rawPayload);
          const response = await collaboration.replayOnBoard({
            boardId: payload.boardId,
            userId: user.id,
            fromSeq: payload.fromSeq,
          });
          ack?.({ ok: true, ...response });
          socket.emit("operation:replayed", response);
        } catch (error) {
          const result = mapError(error);
          ack?.(result);
          socket.emit("error", result.error);
        }
      },
    );

    socket.on("cursor:update", async (rawPayload: unknown) => {
      try {
        const payload = cursorUpdateSchema.parse(rawPayload);
        if (!presence.isPresent(payload.boardId, socket.id)) return;

        const limited = await rateLimitOrAck(
          `rate:board:${payload.boardId}:user:${user.id}:cursor`,
          30,
          1_000,
        );
        if (limited) return;

        socket.to(boardRoom(payload.boardId)).emit("cursor:updated", {
          boardId: payload.boardId,
          userId: user.id,
          username: user.username,
          socketId: socket.id,
          x: payload.x,
          y: payload.y,
        });
      } catch {
        // Ignore malformed cursor updates.
      }
    });

    socket.on("disconnect", async () => {
      for (const boardId of presence.listPresentBoardIds(socket.id)) {
        const left = presence.leaveBoard({ boardId, userId: user.id, socketId: socket.id });
        await socket.leave(boardRoom(boardId));
        socket.to(boardRoom(boardId)).emit("board:user-left", left);
      }
    });
  });

  return {
    disconnectUserSockets(userId: string): void {
      void io.in(userRoom(userId)).disconnectSockets(true);
    },
  };
}
