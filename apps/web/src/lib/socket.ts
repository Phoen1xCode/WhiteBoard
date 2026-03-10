import type { WsClientMessage, WsServerMessage } from "@whiteboard/shared/types/ws";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";
export type CursorData = { clientId: string; x: number; y: number };
type StatusHandler = (s: ConnectionStatus) => void;

let ws: WebSocket | null = null;
let currentBoardId: string | null = null;
let statusHandlers: StatusHandler[] = [];
let opHandlers: ((op: WhiteBoardOperation) => void)[] = [];
let cursorHandlers: ((d: CursorData) => void)[] = [];
let currentStatus: ConnectionStatus = "disconnected";
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

function setStatus(s: ConnectionStatus) {
  currentStatus = s;
  statusHandlers.forEach((h) => h(s));
}

function send(msg: WsClientMessage) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT) {
    setStatus("disconnected");
    return;
  }
  setStatus("reconnecting");
  const delay = Math.min(1000 * 2 ** reconnectAttempts, 5000);
  reconnectTimer = setTimeout(() => {
    reconnectAttempts++;
    if (currentBoardId) connect(currentBoardId);
  }, delay);
}

export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

export function onStatusChange(h: StatusHandler) {
  statusHandlers.push(h);
}

export function offStatusChange(h: StatusHandler) {
  statusHandlers = statusHandlers.filter((x) => x !== h);
}

export function connect(boardId: string) {
  // Guard against dangling WebSocket from previous connection attempt
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  currentBoardId = boardId;
  setStatus("connecting");
  const base = import.meta.env.VITE_WS_URL ?? "http://localhost:4000";
  const url = base.replace(/^http/, "ws") + "/ws";
  ws = new WebSocket(url);

  ws.onopen = () => {
    reconnectAttempts = 0;
    setStatus("connected");
    send({ type: "join-board", boardId });
  };

  ws.onerror = () => {}; // swallow; onclose fires immediately after and drives reconnect
  ws.onclose = () => scheduleReconnect();

  ws.onmessage = (e) => {
    const msg: WsServerMessage = JSON.parse(e.data);
    if (msg.type === "op") opHandlers.forEach((h) => h(msg.data));
    if (msg.type === "cursor") {
      cursorHandlers.forEach((h) =>
        h({ clientId: msg.clientId, x: msg.x, y: msg.y })
      );
    }
  };
}

export function disconnect(boardId: string) {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectAttempts = 0;
  send({ type: "leave-board", boardId });
  ws?.close();
  ws = null;
  currentBoardId = null;
  setStatus("disconnected");
}

export function sendOperation(op: WhiteBoardOperation) {
  send({ type: "op", data: op });
}

export function onOperation(h: (op: WhiteBoardOperation) => void) {
  opHandlers.push(h);
}

export function offOperation(h: (op: WhiteBoardOperation) => void) {
  opHandlers = opHandlers.filter((x) => x !== h);
}

export function sendCursor(boardId: string, x: number, y: number) {
  send({ type: "cursor", boardId, x, y });
}

export function onCursor(h: (d: CursorData) => void) {
  cursorHandlers.push(h);
}

export function offCursor(h: (d: CursorData) => void) {
  cursorHandlers = cursorHandlers.filter((x) => x !== h);
}

// clientId is assigned server-side; server pub/sub already excludes the sender
export function getSocketId(): string | undefined {
  return undefined;
}
