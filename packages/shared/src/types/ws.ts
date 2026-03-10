import type { WhiteBoardOperation } from "./whiteboard";

/** Client → Server */
export type WsClientMessage =
  | { type: "join-board"; boardId: string }
  | { type: "leave-board"; boardId: string }
  | { type: "op"; data: WhiteBoardOperation }
  | { type: "cursor"; boardId: string; x: number; y: number };

/** Server → Client */
export type WsServerMessage =
  | { type: "op"; data: WhiteBoardOperation }
  | { type: "cursor"; boardId: string; clientId: string; x: number; y: number };
