import { io, type Socket } from "socket.io-client";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";

let socket: Socket | null = null;

export function connect(boardId: string) {
  const url = import.meta.env.VITE_WS_URL ?? "http://localhost:4000";
  socket = io(url);
  socket.on("connect", () => {
    socket?.emit("join-board", { boardId });
  });
}

export function disconnect(boardId: string) {
  if (!socket) return;
  socket.emit("leave-board", { boardId });
  socket.disconnect();
  socket = null;
}

export function sendOp(op: WhiteBoardOperation) {
  socket?.emit("op", op);
}

export function onOp(handler: (op: WhiteBoardOperation) => void) {
  socket?.on("op", handler);
}

export function offOp(handler: (op: WhiteBoardOperation) => void) {
  socket?.off("op", handler);
}
