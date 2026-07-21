import type { Server, Socket } from "socket.io";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";
import { checkRateLimit } from "../middleware/rate-limit";
import { commitOperation } from "../services/operation-service";

async function enforceSocketRateLimit(
  socket: Socket,
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  try {
    const result = await checkRateLimit(key, limit, windowMs);

    if (result.allowed) {
      return true;
    }

    socket.emit("error", {
      code: "RATE_LIMITED",
      message: "Too many requests",
      retryAfterMs: result.retryAfterMs,
    });
    return false;
  } catch (error) {
    console.error("Socket rate limit failed:", error);
    socket.emit("error", {
      code: "RATE_LIMIT_UNAVAILABLE",
      message: "Rate limit is unavailable",
    });
    return false;
  }
}

export function initSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    // console message
    console.log("client connected", socket.id);

    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
    });

    socket.on("join-board", ({ boardId }) => {
      socket.join(boardId);
    });

    socket.on("leave-board", ({ boardId }) => {
      socket.leave(boardId);
    });

    socket.on("op", async (operation: WhiteBoardOperation) => {
      const boardId = operation.boardId;
      const allowed = await enforceSocketRateLimit(
        socket,
        `rate:board:${boardId}:socket:${socket.id}:op`,
        120,
        60_000
      );

      if (!allowed) {
        return;
      }

      // 转发给其他客户端
      socket.to(boardId).emit("op", operation);

      // 持久化到数据库
      try {
        await commitOperation({ boardId, operation });
      } catch (error) {
        console.error("Failed to persist operation:", error);
      }
    });

    socket.on(
      "cursor",
      async (payload: { boardId: string; x: number; y: number }) => {
        const allowed = await enforceSocketRateLimit(
          socket,
          `rate:board:${payload.boardId}:socket:${socket.id}:cursor`,
          60,
          10_000
        );

        if (!allowed) {
          return;
        }

        socket.to(payload.boardId).emit("cursor", {
          ...payload,
          clientId: socket.id,
        });
      }
    );
  });
}
