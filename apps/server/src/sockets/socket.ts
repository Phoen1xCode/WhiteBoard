import type { Server, Socket } from "socket.io";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";
import { applyOperationToSnapshot } from "../services/boardsService";

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

      // 转发给其他客户端
      socket.to(boardId).emit("op", operation);

      // 持久化到数据库
      try {
        await applyOperationToSnapshot(boardId, operation);
      } catch (error) {
        console.error("Failed to persist operation:", error);
      }
    });

    socket.on(
      "cursor",
      (payload: { boardId: string; x: number; y: number }) => {
        socket.to(payload.boardId).emit("cursor", {
          ...payload,
          clientId: socket.id,
        });
      }
    );
  });
}
