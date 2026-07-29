import type {
  CommittedOperationPayload,
  OperationAckPayload,
  OperationReplayResultPayload,
  SocketUser,
} from "@whiteboard/shared/types/socket";
import type { Server } from "socket.io";

import type { AuthenticatedUser } from "@/types/auth";

import { requireView } from "@/board-access";
import { AppError } from "@/lib/app-error";
import {
  commitOperation,
  getOperationsAfter,
  type CommittedOperation,
} from "@/operations";

/** In-process presence. Redis adapter when multi-instance lands. */
const boardMembers = new Map<string, Map<string, SocketUser>>();
let ioRef: Server | null = null;

export function boardRoom(boardId: string): string {
  return `board:${boardId}`;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function bindIo(io: Server): void {
  ioRef = io;
}

export function disconnectUserSockets(userId: string): void {
  ioRef?.in(userRoom(userId)).disconnectSockets(true);
}

function toSocketUser(user: AuthenticatedUser): SocketUser {
  return { id: user.id, email: user.email, username: user.username };
}

function memberMap(boardId: string): Map<string, SocketUser> {
  let members = boardMembers.get(boardId);
  if (!members) {
    members = new Map();
    boardMembers.set(boardId, members);
  }
  return members;
}

export function isPresent(boardId: string, socketId: string): boolean {
  return boardMembers.get(boardId)?.has(socketId) ?? false;
}

export function toCommittedPayload(operation: CommittedOperation): CommittedOperationPayload {
  return {
    id: operation.id,
    boardId: operation.boardId,
    userId: operation.userId,
    seq: operation.seq,
    opType: operation.opType,
    elementId: operation.elementId,
    clientOpId: operation.clientOpId,
    payload: operation.payload,
    createdAt: operation.createdAt,
  };
}

export async function joinBoard(input: {
  boardId: string;
  user: AuthenticatedUser;
  socketId: string;
}): Promise<{ boardId: string; user: SocketUser; members: SocketUser[] }> {
  await requireView(input.boardId, input.user.id);
  const user = toSocketUser(input.user);
  const members = memberMap(input.boardId);
  members.set(input.socketId, user);
  return {
    boardId: input.boardId,
    user,
    members: [...members.values()],
  };
}

export function leaveBoard(input: {
  boardId: string;
  userId: string;
  socketId: string;
}): { boardId: string; userId: string; socketId: string } {
  const members = boardMembers.get(input.boardId);
  if (members) {
    members.delete(input.socketId);
    if (members.size === 0) {
      boardMembers.delete(input.boardId);
    }
  }
  return {
    boardId: input.boardId,
    userId: input.userId,
    socketId: input.socketId,
  };
}

export function listPresentBoardIds(socketId: string): string[] {
  const boardIds: string[] = [];
  for (const [boardId, members] of boardMembers) {
    if (members.has(socketId)) boardIds.push(boardId);
  }
  return boardIds;
}

export async function commitOnBoard(input: {
  boardId: string;
  userId: string;
  socketId: string;
  operation: Parameters<typeof commitOperation>[0]["operation"];
  clientOpId?: string | null;
}): Promise<{ ack: OperationAckPayload; broadcast: CommittedOperationPayload | null }> {
  if (!isPresent(input.boardId, input.socketId)) {
    throw new AppError(400, "NOT_JOINED", "Join the board before committing");
  }

  const committed = await commitOperation({
    boardId: input.boardId,
    operation: input.operation,
    userId: input.userId,
    clientOpId: input.clientOpId ?? null,
  });

  const operationPayload = toCommittedPayload(committed);
  return {
    ack: {
      ok: true,
      clientOpId: committed.clientOpId,
      seq: committed.seq,
      serverTime: new Date().toISOString(),
      operation: operationPayload,
    },
    broadcast: committed.created ? operationPayload : null,
  };
}

export async function replayOnBoard(input: {
  boardId: string;
  userId: string;
  fromSeq: number;
}): Promise<OperationReplayResultPayload> {
  const operations = await getOperationsAfter(input.boardId, input.fromSeq, input.userId);
  return {
    boardId: input.boardId,
    fromSeq: input.fromSeq,
    operations: operations.map(toCommittedPayload),
  };
}
