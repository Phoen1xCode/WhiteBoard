import type { Server, Socket } from "socket.io";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";

export function initSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("client connected", socket.id);

    socket.on("join-board", ({ boardId }) => {
      socket.join(boardId);
    });

    socket.on("leave-board", ({ boardId }) => {
      socket.leave(boardId);
    });

    socket.on("op", (op: WhiteBoardOperation) => {
      // 这里先只做转发，不改服务器状态
      const boardId = op.boardId;
      socket.to(boardId).emit("op", op);
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
