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

export class SocketCommitError extends Error {
  readonly code: string;
  readonly definitive: boolean;

  constructor(message: string, code: string, definitive: boolean) {
    super(message);
    this.name = "SocketCommitError";
    this.code = code;
    this.definitive = definitive;
  }
}

const JOIN_TIMEOUT_MS = 15_000;
const DEFINITIVE_ERROR_CODES = new Set([
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "INVALID_OPERATION",
  "UNAUTHORIZED",
  "BOARD_NOT_FOUND",
]);

let socket: Socket | null = null;
let currentBoardId: string | null = null;
let lastConfirmedSeq = 0;
let statusChangeHandlers: StatusChangeHandler[] = [];
let operationHandlers: OperationHandler[] = [];
let cursorHandlers: CursorHandler[] = [];
let ackHandlers: AckHandler[] = [];
let currentStatus: ConnectionStatus = "disconnected";
let isBoardJoined = false;
let boardReadyError: Error | null = null;
let readyWaiters: ReadyWaiter[] = [];
let authRefreshInFlight: Promise<string | null> | null = null;
const outboundByBoard = new Map<string, Promise<unknown>>();

function isDefinitiveErrorCode(code: string): boolean {
  return DEFINITIVE_ERROR_CODES.has(code);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  if (boardReadyError) {
    return Promise.reject(boardReadyError);
  }

  return new Promise<void>((resolve, reject) => {
    const waiter: ReadyWaiter = {
      resolve: () => {
        clearTimeout(timer);
        resolve();
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    };
    const timer = setTimeout(() => {
      readyWaiters = readyWaiters.filter((entry) => entry !== waiter);
      waiter.reject(new SocketCommitError("Board join timeout", "JOIN_TIMEOUT", false));
    }, JOIN_TIMEOUT_MS);
    readyWaiters.push(waiter);
  });
}

function markBoardJoined(): void {
  isBoardJoined = true;
  boardReadyError = null;
  const waiters = readyWaiters;
  readyWaiters = [];
  waiters.forEach((waiter) => waiter.resolve());
}

function markBoardLeft(): void {
  isBoardJoined = false;
}

export function failBoardReady(reason: string): void {
  isBoardJoined = false;
  const error = new SocketCommitError(reason, "BOARD_NOT_READY", false);
  boardReadyError = error;
  const waiters = readyWaiters;
  readyWaiters = [];
  waiters.forEach((waiter) => waiter.reject(error));
}

export function isBoardReady(): boolean {
  return isBoardJoined;
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

async function ensureJoined(boardId: string): Promise<void> {
  if (isBoardJoined && socket?.connected) {
    return;
  }
  if (!socket?.connected) {
    throw new SocketCommitError("Socket is not connected", "NOT_CONNECTED", false);
  }

  boardReadyError = null;
  markBoardLeft();
  setStatus("reconnecting");
  await joinBoard(boardId);
  await requestReplay(boardId, lastConfirmedSeq);
  markBoardJoined();
  setStatus("connected");
}

function wireSocketEvents(next: Socket) {
  next.on("connect", async () => {
    if (!currentBoardId) {
      setStatus("connected");
      markBoardJoined();
      return;
    }

    const maxAttempts = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        boardReadyError = null;
        markBoardLeft();
        setStatus(attempt === 1 ? "connecting" : "reconnecting");
        await joinBoard(currentBoardId);
        await requestReplay(currentBoardId, lastConfirmedSeq);
        markBoardJoined();
        setStatus("connected");
        return;
      } catch (error) {
        lastError = error;
        console.error(`Failed to join board (attempt ${attempt}):`, error);
        if (attempt < maxAttempts) {
          await sleep(400 * attempt);
        }
      }
    }

    failBoardReady(
      lastError instanceof Error ? lastError.message : "Failed to join board"
    );
    setStatus("disconnected");
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
  boardReadyError = null;
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
      reject(new SocketCommitError("Socket is not connected", "NOT_CONNECTED", false));
      return;
    }

    socket
      .timeout(8_000)
      .emit(event, payload, (err: Error | null, result: AckResult<T>) => {
        if (err) {
          reject(new SocketCommitError(err.message, "ACK_TIMEOUT", false));
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

async function reconcileClientOp(
  boardId: string,
  clientOpId: string
): Promise<OperationAckPayload | null> {
  await waitUntilBoardJoined();

  if (!socket?.connected || !isBoardJoined) {
    return null;
  }

  const result = await emitWithAck<OperationReplayResultPayload>("operation:replay", {
    boardId,
    fromSeq: lastConfirmedSeq,
  });

  if (!result.ok) {
    return null;
  }

  let matched: CommittedOperationPayload | null = null;
  for (const op of result.operations) {
    setLastConfirmedSeq(op.seq);
    operationHandlers.forEach((handler) => handler(op.payload, op.seq));
    if (op.clientOpId === clientOpId) {
      matched = op;
    }
  }

  if (!matched) {
    return null;
  }

  return {
    ok: true,
    clientOpId,
    seq: matched.seq,
    serverTime: matched.createdAt,
    operation: matched,
  };
}

async function commitOnce(
  operation: WhiteBoardOperation,
  clientOpId: string
): Promise<OperationAckPayload> {
  await waitUntilBoardJoined();

  if (!socket?.connected || !isBoardJoined) {
    throw new SocketCommitError("Socket is not joined", "NOT_JOINED", false);
  }

  const result = await emitWithAck<OperationAckPayload>("operation:commit", {
    boardId: operation.boardId,
    operation,
    clientOpId,
  });

  if (!result.ok) {
    throw new SocketCommitError(
      result.error.message,
      result.error.code,
      isDefinitiveErrorCode(result.error.code)
    );
  }

  setLastConfirmedSeq(result.seq);
  ackHandlers.forEach((handler) => handler(result));
  return result;
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
  const boardId = operation.boardId;

  const run = async (): Promise<OperationAckPayload> => {
    let rateLimitAttempts = 0;
    let recommitAttempts = 0;
    const maxRecommitAttempts = 3;

    for (;;) {
      try {
        return await commitOnce(operation, clientOpId);
      } catch (error) {
        if (error instanceof SocketCommitError && error.definitive) {
          throw error;
        }

        if (
          error instanceof SocketCommitError &&
          (error.code === "RATE_LIMITED" || error.code === "RATE_LIMIT_UNAVAILABLE") &&
          rateLimitAttempts < 5
        ) {
          rateLimitAttempts += 1;
          await sleep(200 * rateLimitAttempts);
          continue;
        }

        try {
          const recovered = await reconcileClientOp(boardId, clientOpId);
          if (recovered) {
            ackHandlers.forEach((handler) => handler(recovered));
            return recovered;
          }
        } catch {
          // Fall through to limited recommit.
        }

        if (recommitAttempts < maxRecommitAttempts) {
          recommitAttempts += 1;
          try {
            if (
              error instanceof SocketCommitError &&
              (error.code === "BOARD_NOT_READY" ||
                error.code === "NOT_JOINED" ||
                error.code === "JOIN_TIMEOUT")
            ) {
              await ensureJoined(boardId);
            } else if (socket?.connected && !isBoardJoined) {
              await ensureJoined(boardId);
            }
          } catch {
            // Retry commitOnce anyway after backoff.
          }
          await sleep(300 * recommitAttempts);
          continue;
        }

        throw error instanceof Error
          ? error
          : new SocketCommitError("Failed to commit operation", "COMMIT_FAILED", false);
      }
    }
  };

  const previous = outboundByBoard.get(boardId) ?? Promise.resolve();
  const current = previous.then(run, run);
  outboundByBoard.set(
    boardId,
    current.then(
      () => undefined,
      () => undefined
    )
  );
  return current;
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
