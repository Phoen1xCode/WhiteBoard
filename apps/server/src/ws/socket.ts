import type { ServerWebSocket } from "bun";
import type { WsClientMessage, WsServerMessage } from "@whiteboard/shared/types/ws";
import { applyOperationToSnapshot } from "../services/boardsService";

export type WsData = { clientId: string; boardId: string | null };

export const wsHandlers = {
  open(ws: ServerWebSocket<WsData>) {
    console.log("client connected", ws.data.clientId);
  },

  async message(ws: ServerWebSocket<WsData>, raw: string | Buffer) {
    let msg: WsClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      console.warn("Received malformed WS message, ignoring.");
      return;
    }

    switch (msg.type) {
      case "join-board":
        ws.data.boardId = msg.boardId;
        ws.subscribe(msg.boardId);
        break;

      case "leave-board":
        ws.unsubscribe(msg.boardId);
        ws.data.boardId = null;
        break;

      case "op": {
        const outbound: WsServerMessage = { type: "op", data: msg.data };
        // ws.publish excludes the sender — equivalent to socket.to(room).emit()
        // boardId is taken from the operation payload; a well-behaved client
        // should only send ops for the board they joined. Enforcing this is
        // out of scope for this migration.
        ws.publish(msg.data.boardId, JSON.stringify(outbound));
        try {
          await applyOperationToSnapshot(msg.data.boardId, msg.data);
        } catch (err) {
          console.error("Failed to persist operation:", err);
        }
        break;
      }

      case "cursor": {
        const outbound: WsServerMessage = {
          type: "cursor",
          boardId: msg.boardId,
          clientId: ws.data.clientId,
          x: msg.x,
          y: msg.y,
        };
        ws.publish(msg.boardId, JSON.stringify(outbound));
        break;
      }
    }
  },

  close(ws: ServerWebSocket<WsData>) {
    console.log("client disconnected", ws.data.clientId);
    if (ws.data.boardId) ws.unsubscribe(ws.data.boardId);
  },
};
