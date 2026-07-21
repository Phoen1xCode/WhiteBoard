import type { WhiteBoardOperation } from "./whiteboard";

export interface SocketUser {
  id: string;
  email: string;
  username: string;
}

/** Client → Server payloads */
export interface BoardJoinPayload {
  boardId: string;
}

export interface BoardLeavePayload {
  boardId: string;
}

export interface CursorUpdatePayload {
  boardId: string;
  x: number;
  y: number;
}

export interface OperationCommitPayload {
  boardId: string;
  operation: WhiteBoardOperation;
  clientOpId?: string;
}

export interface OperationReplayPayload {
  boardId: string;
  fromSeq: number;
}

/** Server → Client payloads */
export interface BoardJoinedPayload {
  boardId: string;
  user: SocketUser;
  members: SocketUser[];
}

export interface BoardUserJoinedPayload {
  boardId: string;
  user: SocketUser;
}

export interface BoardUserLeftPayload {
  boardId: string;
  userId: string;
  socketId: string;
}

export interface CursorUpdatedPayload {
  boardId: string;
  userId: string;
  username: string;
  socketId: string;
  x: number;
  y: number;
}

export interface CommittedOperationPayload {
  id: string;
  boardId: string;
  userId: string | null;
  seq: number;
  opType: string;
  elementId: string | null;
  clientOpId: string | null;
  payload: WhiteBoardOperation;
  createdAt: string;
}

export interface OperationAckPayload {
  ok: true;
  clientOpId: string | null;
  seq: number;
  serverTime: string;
  operation: CommittedOperationPayload;
}

export interface OperationReplayResultPayload {
  boardId: string;
  fromSeq: number;
  operations: CommittedOperationPayload[];
}

export interface SocketErrorPayload {
  code: string;
  message: string;
  retryAfterMs?: number;
}

export interface AckError {
  ok: false;
  error: SocketErrorPayload;
}

export type AckResult<T> = ({ ok: true } & T) | AckError;
