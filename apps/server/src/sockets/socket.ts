import type { Server, Socket } from "socket.io";
import { ZodError } from "zod";
import {
  boardJoinSchema,
  cursorUpdateSchema,
  operationCommitSchema,
  operationReplaySchema,
} from "@whiteboard/shared/schemas";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";
import type {
  AckResult,
  BoardJoinedPayload,
  CommittedOperationPayload,
  OperationAckPayload,
  OperationReplayResultPayload,
  SocketUser,
} from "@whiteboard/shared/types/socket";
import { isAppError } from "../lib/app-error";
import { verifyAccessToken } from "../lib/jwt";
import { isTokenBlacklisted } from "../lib/token-blacklist";
import { checkRateLimit } from "../middleware/rate-limit";
import { findUserById } from "../repositories/user-repository";
import { assertCanAccessBoard, assertCanEditBoard } from "../services/boardsService";
import {
  commitOperation,
  getOperationsAfter,
  type CommittedOperation,
} from "../services/operation-service";
import type { AuthenticatedUser } from "../types/auth";

type AuthedSocket = Socket & {
  data: {
    user: AuthenticatedUser;
    joinedBoards: Set<string>;
  };
};

const boardMembers = new Map<string, Map<string, SocketUser>>();
let ioRef: Server | null = null;

function toSocketUser(user: AuthenticatedUser): SocketUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

function roomName(boardId: string): string {
  return `board:${boardId}`;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

function getBoardMemberMap(boardId: string): Map<string, SocketUser> {
  let members = boardMembers.get(boardId);
  if (!members) {
    members = new Map();
    boardMembers.set(boardId, members);
  }
  return members;
}

function toCommittedPayload(operation: CommittedOperation): CommittedOperationPayload {
  return {
    id: operation.id,
    boardId: operation.boardId,
    userId: operation.userId,
    seq: operation.seq,
    opType: operation.opType,
    elementId: operation.elementId,
    clientOpId: operation.clientOpId,
    payload: operation.payload,
    createdAt: operation.createdAt,
  };
}

function errorAck(code: string, message: string, retryAfterMs?: number): AckResult<never> {
  return {
    ok: false,
    error: { code, message, retryAfterMs },
  };
}

function formatZodMessage(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
    .join("; ");
}

function mapError(error: unknown): AckResult<never> {
  if (isAppError(error)) {
    return errorAck(error.code, error.message);
  }

  if (error instanceof ZodError) {
    return errorAck("VALIDATION_ERROR", formatZodMessage(error));
  }

  console.error("Socket handler error:", error);
  return errorAck("INTERNAL_SERVER_ERROR", "Internal server error");
}

async function enforceSocketRateLimit(
  socket: Socket,
  key: string,
  limit: number,
  windowMs: number
): Promise<AckResult<never> | null> {
  try {
    const result = await checkRateLimit(key, limit, windowMs);
    if (result.allowed) {
      return null;
    }

    return errorAck("RATE_LIMITED", "Too many requests", result.retryAfterMs);
  } catch (error) {
    console.error("Socket rate limit failed:", error);
    return errorAck("RATE_LIMIT_UNAVAILABLE", "Rate limit is unavailable");
  }
}

async function authenticateSocket(socket: Socket): Promise<AuthenticatedUser> {
  const token =
    typeof socket.handshake.auth?.token === "string"
      ? socket.handshake.auth.token
      : typeof socket.handshake.headers.authorization === "string" &&
          socket.handshake.headers.authorization.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice("Bearer ".length)
        : null;

  if (!token) {
    throw new Error("Missing auth token");
  }

  const payload = verifyAccessToken(token);
  if (await isTokenBlacklisted(payload.jti)) {
    throw new Error("Token revoked");
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

export function disconnectUserSockets(userId: string): void {
  ioRef?.in(userRoom(userId)).disconnectSockets(true);
}

export function initSocket(io: Server): void {
  ioRef = io;

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      (socket as AuthedSocket).data.user = user;
      (socket as AuthedSocket).data.joinedBoards = new Set();
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (rawSocket: Socket) => {
    const socket = rawSocket as AuthedSocket;
    const user = socket.data.user;
    if (!socket.data.joinedBoards) {
      socket.data.joinedBoards = new Set();
    }

    void socket.join(userRoom(user.id));

    socket.on(
      "board:join",
      async (rawPayload: unknown, ack?: (result: AckResult<BoardJoinedPayload>) => void) => {
        try {
          const payload = boardJoinSchema.parse(rawPayload);
          await assertCanAccessBoard(payload.boardId, user.id);

          const room = roomName(payload.boardId);
          await socket.join(room);
          socket.data.joinedBoards.add(payload.boardId);

          const members = getBoardMemberMap(payload.boardId);
          members.set(socket.id, toSocketUser(user));

          socket.to(room).emit("board:user-joined", {
            boardId: payload.boardId,
            user: toSocketUser(user),
          });

          const response: BoardJoinedPayload = {
            boardId: payload.boardId,
            user: toSocketUser(user),
            members: [...members.values()],
          };
          ack?.({ ok: true, ...response });
          socket.emit("board:joined", response);
        } catch (error) {
          const result = mapError(error);
          ack?.(result);
          socket.emit("error", result.error);
        }
      }
    );

    socket.on("board:leave", async (rawPayload: unknown) => {
      try {
        const payload = boardJoinSchema.parse(rawPayload);
        await leaveBoard(socket, payload.boardId);
      } catch (error) {
        socket.emit("error", mapError(error).error);
      }
    });

    socket.on(
      "operation:commit",
      async (
        rawPayload: unknown,
        ack?: (result: AckResult<OperationAckPayload>) => void
      ) => {
        try {
          const payload = operationCommitSchema.parse(rawPayload);

          if (!socket.data.joinedBoards.has(payload.boardId)) {
            const result = errorAck("NOT_JOINED", "Join the board before committing");
            ack?.(result);
            return;
          }

          const rateLimited = await enforceSocketRateLimit(
            socket,
            `rate:board:${payload.boardId}:user:${user.id}:op`,
            60,
            1_000
          );
          if (rateLimited) {
            ack?.(rateLimited);
            return;
          }

          await assertCanEditBoard(payload.boardId, user.id);

          // authorize -> persist -> ack submitter -> broadcast others
          const committed = await commitOperation({
            boardId: payload.boardId,
            operation: payload.operation as WhiteBoardOperation,
            userId: user.id,
            clientOpId: payload.clientOpId ?? null,
          });

          const operationPayload = toCommittedPayload(committed);
          const ackPayload: OperationAckPayload = {
            ok: true,
            clientOpId: committed.clientOpId,
            seq: committed.seq,
            serverTime: new Date().toISOString(),
            operation: operationPayload,
          };

          ack?.(ackPayload);
          socket.to(roomName(payload.boardId)).emit("operation:committed", operationPayload);
        } catch (error) {
          const result = mapError(error);
          ack?.(result);
          socket.emit("error", result.error);
        }
      }
    );

    socket.on(
      "operation:replay",
      async (
        rawPayload: unknown,
        ack?: (result: AckResult<OperationReplayResultPayload>) => void
      ) => {
        try {
          const payload = operationReplaySchema.parse(rawPayload);
          const operations = await getOperationsAfter(
            payload.boardId,
            payload.fromSeq,
            user.id
          );
          const response: OperationReplayResultPayload = {
            boardId: payload.boardId,
            fromSeq: payload.fromSeq,
            operations: operations.map(toCommittedPayload),
          };
          ack?.({ ok: true, ...response });
          socket.emit("operation:replayed", response);
        } catch (error) {
          const result = mapError(error);
          ack?.(result);
          socket.emit("error", result.error);
        }
      }
    );

    socket.on("cursor:update", async (rawPayload: unknown) => {
      try {
        const payload = cursorUpdateSchema.parse(rawPayload);
        if (!socket.data.joinedBoards.has(payload.boardId)) {
          return;
        }

        const rateLimited = await enforceSocketRateLimit(
          socket,
          `rate:board:${payload.boardId}:user:${user.id}:cursor`,
          30,
          1_000
        );
        if (rateLimited) {
          return;
        }

        socket.to(roomName(payload.boardId)).emit("cursor:updated", {
          boardId: payload.boardId,
          userId: user.id,
          username: user.username,
          socketId: socket.id,
          x: payload.x,
          y: payload.y,
        });
      } catch {
        // ignore malformed cursor updates
      }
    });

    socket.on("disconnect", async () => {
      const boardIds = [...socket.data.joinedBoards];
      for (const boardId of boardIds) {
        await leaveBoard(socket, boardId);
      }
    });
  });
}

async function leaveBoard(socket: AuthedSocket, boardId: string): Promise<void> {
  const room = roomName(boardId);
  await socket.leave(room);
  socket.data.joinedBoards.delete(boardId);

  const members = boardMembers.get(boardId);
  if (members) {
    members.delete(socket.id);
    if (members.size === 0) {
      boardMembers.delete(boardId);
    }
  }

  socket.to(room).emit("board:user-left", {
    boardId,
    userId: socket.data.user.id,
    socketId: socket.id,
  });
}
