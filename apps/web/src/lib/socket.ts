import { io, type Socket } from "socket.io-client";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";
import type {
  AckResult,
  CommittedOperationPayload,
  CursorUpdatedPayload,
  OperationAckPayload,
  OperationReplayResultPayload,
} from "@whiteboard/shared/types/socket";
import { refreshAccessToken } from "./api";
import { getAccessToken } from "./auth";

type StatusChangeHandler = (status: ConnectionStatus) => void;
type OperationHandler = (operation: WhiteBoardOperation, seq: number) => void;
type CursorHandler = (data: CursorData) => void;
type AckHandler = (ack: OperationAckPayload) => void;
type ReadyWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
};

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export type CursorData = {
  clientId: string;
  userId?: string;
  username?: string;
  x: number;
  y: number;
};

let socket: Socket | null = null;
let currentBoardId: string | null = null;
let lastConfirmedSeq = 0;
let statusChangeHandlers: StatusChangeHandler[] = [];
let operationHandlers: OperationHandler[] = [];
let cursorHandlers: CursorHandler[] = [];
let ackHandlers: AckHandler[] = [];
let currentStatus: ConnectionStatus = "disconnected";
let isBoardJoined = false;
let readyWaiters: ReadyWaiter[] = [];
let authRefreshInFlight: Promise<string | null> | null = null;

function setStatus(status: ConnectionStatus) {
  currentStatus = status;
  statusChangeHandlers.forEach((handler) => handler(status));
}

function getUrl(): string {
  return import.meta.env.VITE_WS_URL ?? "http://localhost:4000";
}

function waitUntilBoardJoined(): Promise<void> {
  if (isBoardJoined) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    readyWaiters.push({ resolve, reject });
  });
}

function markBoardJoined(): void {
  isBoardJoined = true;
  const waiters = readyWaiters;
  readyWaiters = [];
  waiters.forEach((waiter) => waiter.resolve());
}

function markBoardLeft(): void {
  isBoardJoined = false;
}

function failBoardReady(reason: string): void {
  isBoardJoined = false;
  const error = new Error(reason);
  const waiters = readyWaiters;
  readyWaiters = [];
  waiters.forEach((waiter) => waiter.reject(error));
}

export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

export function getLastConfirmedSeq(): number {
  return lastConfirmedSeq;
}

export function setLastConfirmedSeq(seq: number): void {
  lastConfirmedSeq = Math.max(lastConfirmedSeq, seq);
}

export function resetLastConfirmedSeq(seq = 0): void {
  lastConfirmedSeq = seq;
}

export function onStatusChange(handler: StatusChangeHandler) {
  statusChangeHandlers.push(handler);
}

export function offStatusChange(handler: StatusChangeHandler) {
  statusChangeHandlers = statusChangeHandlers.filter((h) => h !== handler);
}

function wireSocketEvents(next: Socket) {
  next.on("connect", async () => {
    setStatus("connected");
    if (!currentBoardId) {
      markBoardJoined();
      return;
    }

    try {
      await joinBoard(currentBoardId);
      await requestReplay(currentBoardId, lastConfirmedSeq);
      markBoardJoined();
    } catch (error) {
      failBoardReady(error instanceof Error ? error.message : "Failed to join board");
      console.error("Failed to join board after connect:", error);
    }
  });

  next.on("disconnect", () => {
    markBoardLeft();
    setStatus("disconnected");
  });

  next.on("reconnect_attempt", () => {
    setStatus("reconnecting");
  });

  next.on("reconnect", () => {
    setStatus("connected");
  });

  next.on("reconnect_failed", () => {
    failBoardReady("Reconnect failed");
    setStatus("disconnected");
  });

  next.on("connect_error", async (error) => {
    if (error.message !== "UNAUTHORIZED") {
      return;
    }

    if (!authRefreshInFlight) {
      authRefreshInFlight = refreshAccessToken().finally(() => {
        authRefreshInFlight = null;
      });
    }

    const token = await authRefreshInFlight;
    if (!token) {
      failBoardReady("Unauthorized");
      next.disconnect();
      setStatus("disconnected");
    }
  });

  next.on("operation:committed", (payload: CommittedOperationPayload) => {
    setLastConfirmedSeq(payload.seq);
    operationHandlers.forEach((handler) => handler(payload.payload, payload.seq));
  });

  next.on("cursor:updated", (payload: CursorUpdatedPayload) => {
    cursorHandlers.forEach((handler) =>
      handler({
        clientId: payload.socketId,
        userId: payload.userId,
        username: payload.username,
        x: payload.x,
        y: payload.y,
      })
    );
  });
}

export function connect(boardId: string) {
  if (!getAccessToken()) {
    setStatus("disconnected");
    throw new Error("Not authenticated");
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentBoardId = boardId;
  markBoardLeft();
  setStatus("connecting");

  socket = io(getUrl(), {
    auth: (cb) => {
      cb({ token: getAccessToken() ?? "" });
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  wireSocketEvents(socket);
}

function emitWithAck<T>(event: string, payload: unknown): Promise<AckResult<T>> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Socket is not connected"));
      return;
    }

    socket
      .timeout(8_000)
      .emit(event, payload, (err: Error | null, result: AckResult<T>) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
  });
}

async function joinBoard(boardId: string): Promise<void> {
  const result = await emitWithAck<{ boardId: string }>("board:join", { boardId });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
}

export async function requestReplay(boardId: string, fromSeq: number): Promise<void> {
  const result = await emitWithAck<OperationReplayResultPayload>("operation:replay", {
    boardId,
    fromSeq,
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  for (const op of result.operations) {
    setLastConfirmedSeq(op.seq);
    operationHandlers.forEach((handler) => handler(op.payload, op.seq));
  }
}

export function disconnect(boardId: string) {
  if (!socket) return;
  socket.emit("board:leave", { boardId });
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  currentBoardId = null;
  failBoardReady("Socket disconnected");
  setStatus("disconnected");
}

export async function sendOperation(
  operation: WhiteBoardOperation,
  clientOpId: string
): Promise<OperationAckPayload> {
  await waitUntilBoardJoined();

  if (!socket?.connected || !isBoardJoined) {
    throw new Error("Socket is not joined");
  }

  const result = await emitWithAck<OperationAckPayload>("operation:commit", {
    boardId: operation.boardId,
    operation,
    clientOpId,
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  setLastConfirmedSeq(result.seq);
  ackHandlers.forEach((handler) => handler(result));
  return result;
}

export function onOperation(handler: OperationHandler) {
  operationHandlers.push(handler);
}

export function offOperation(handler: OperationHandler) {
  operationHandlers = operationHandlers.filter((h) => h !== handler);
}

export function onAck(handler: AckHandler) {
  ackHandlers.push(handler);
}

export function offAck(handler: AckHandler) {
  ackHandlers = ackHandlers.filter((h) => h !== handler);
}

export function sendCursor(boardId: string, x: number, y: number) {
  if (!isBoardJoined) return;
  socket?.emit("cursor:update", { boardId, x, y });
}

export function onCursor(handler: CursorHandler) {
  cursorHandlers.push(handler);
}

export function offCursor(handler: CursorHandler) {
  cursorHandlers = cursorHandlers.filter((h) => h !== handler);
}

export function getSocketId(): string | undefined {
  return socket?.id;
}
