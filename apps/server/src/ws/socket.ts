import type { ServerWebSocket } from "bun";
import type { WsClientMessage, WsServerMessage } from "@whiteboard/shared/types/ws";

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
        // TODO: Plan 2 will add event sourcing integration here
        const outbound: WsServerMessage = { type: "op", data: msg.data };
        ws.publish(msg.data.boardId, JSON.stringify(outbound));
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
