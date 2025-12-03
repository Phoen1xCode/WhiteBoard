import { io, type Socket } from "socket.io-client";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";

type StatusChangeHandler = (status: ConnectionStatus) => void;

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

let socket: Socket | null = null;
let currentBoardId: string | null = null;
let statusChangeHandlers: StatusChangeHandler[] = [];
let currentStatus: ConnectionStatus = "disconnected";

function setStatus(status: ConnectionStatus) {
  currentStatus = status;
  statusChangeHandlers.forEach((handler) => handler(status));
}

export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

export function onStatusChange(handler: StatusChangeHandler) {
  statusChangeHandlers.push(handler);
}

export function offStatusChange(handler: StatusChangeHandler) {
  statusChangeHandlers = statusChangeHandlers.filter((h) => h !== handler);
}

export function connect(boardId: string) {
  const url = import.meta.env.VITE_WS_URL ?? "http://localhost:4000";
  currentBoardId = boardId;
  setStatus("connecting");

  socket = io(url, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    setStatus("connected");
    socket?.emit("join-board", { boardId: currentBoardId });
  });

  socket.on("disconnect", () => {
    setStatus("disconnected");
  });

  socket.on("reconnect_attempt", () => {
    setStatus("reconnecting");
  });

  socket.on("reconnect", () => {
    setStatus("connected");
    // Rejoin the board after reconnection
    if (currentBoardId) {
      socket?.emit("join-board", { boardId: currentBoardId });
    }
  });

  socket.on("reconnect_failed", () => {
    setStatus("disconnected");
  });
}

function isSocketConnected(): boolean {
  if (!socket?.connected) {
    console.warn("Socket is not connected.");
    return false;
  }
  return true;
}

export function disconnect(boardId: string) {
  if (!socket) return;
  socket.emit("leave-board", { boardId });
  socket.disconnect();
  socket = null;
  currentBoardId = null;
  setStatus("disconnected");
}

export function sendOperation(operation: WhiteBoardOperation) {
  socket?.emit("op", operation);
}

export function onOperation(handler: (operation: WhiteBoardOperation) => void) {
  socket?.on("op", handler);
}

export function offOperation(
  handler: (operation: WhiteBoardOperation) => void
) {
  socket?.off("op", handler);
}

// Cursor events for real-time cursor display
export function sendCursor(boardId: string, x: number, y: number) {
  if (!isSocketConnected()) {
    console.warn("Cannot send cursor data.");
  }
  socket?.emit("cursor", { boardId, x, y });
}

export type CursorData = {
  clientId: string;
  x: number;
  y: number;
};

export function onCursor(handler: (data: CursorData) => void) {
  if (!isSocketConnected()) {
    console.warn("Cannot listen to cursor data.");
  }
  socket?.on("cursor", handler);
}

export function offCursor(handler: (data: CursorData) => void) {
  if (!isSocketConnected()) {
    console.warn("Cannot stop listening to cursor data.");
  }
  socket?.off("cursor", handler);
}

export function getSocketId(): string | undefined {
  return socket?.id;
}
