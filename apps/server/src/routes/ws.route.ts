import { Elysia } from "elysia";
import type { WsClientMessage, WsServerMessage } from "@whiteboard/shared/types/ws";
import { config } from "../config";

type WsData = { clientId: string; boardId: string | null };

/** Per-connection mutable state keyed by the ws.id assigned at open-time. */
const connections = new Map<string, WsData>();

export const wsRoute = new Elysia().ws("/ws", {
  idleTimeout: 120,
  maxPayloadLength: config.WS_MAX_PAYLOAD_BYTES,

  open(ws) {
    const clientId = crypto.randomUUID();
    connections.set(ws.id, { clientId, boardId: null });
    console.log("client connected", clientId);
  },

  async message(ws, raw) {
    const conn = connections.get(ws.id);
    if (!conn) return;

    let msg: WsClientMessage;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      console.warn("Received malformed WS message, ignoring.");
      return;
    }

    switch (msg.type) {
      case "join-board":
        conn.boardId = msg.boardId;
        ws.subscribe(msg.boardId);
        break;

      case "leave-board":
        ws.unsubscribe(msg.boardId);
        conn.boardId = null;
        break;

      case "op": {
        const outbound: WsServerMessage = { type: "op", data: msg.data };
        ws.publish(msg.data.boardId, JSON.stringify(outbound));
        break;
      }

      case "cursor": {
        const outbound: WsServerMessage = {
          type: "cursor",
          boardId: msg.boardId,
          clientId: conn.clientId,
          x: msg.x,
          y: msg.y,
        };
        ws.publish(msg.boardId, JSON.stringify(outbound));
        break;
      }
    }
  },

  close(ws) {
    const conn = connections.get(ws.id);
    console.log("client disconnected", conn?.clientId ?? ws.id);
    if (conn?.boardId) ws.unsubscribe(conn.boardId);
    connections.delete(ws.id);
  },
});
