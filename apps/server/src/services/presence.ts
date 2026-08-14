import type { SocketUser } from "@whiteboard/shared/types/socket";

import type { BoardAccess } from "@/services/board-access";
import type { AuthenticatedUser } from "@/types/auth";

export function boardRoom(boardId: string): string {
  return `board:${boardId}`;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

function toSocketUser(user: AuthenticatedUser): SocketUser {
  return { id: user.id, email: user.email, username: user.username };
}

/** In-process presence (single instance). */
export function createPresence({ boardAccess }: { boardAccess: BoardAccess }) {
  const boardMembers = new Map<string, Map<string, SocketUser>>();

  function memberMap(boardId: string): Map<string, SocketUser> {
    let members = boardMembers.get(boardId);
    if (!members) {
      members = new Map();
      boardMembers.set(boardId, members);
    }
    return members;
  }

  async function joinBoard(input: {
    boardId: string;
    user: AuthenticatedUser;
    socketId: string;
  }): Promise<{ boardId: string; user: SocketUser; members: SocketUser[] }> {
    await boardAccess.requireView(input.boardId, input.user.id);
    const user = toSocketUser(input.user);
    const members = memberMap(input.boardId);
    members.set(input.socketId, user);
    return {
      boardId: input.boardId,
      user,
      members: [...members.values()],
    };
  }

  function leaveBoard(input: { boardId: string; userId: string; socketId: string }): {
    boardId: string;
    userId: string;
    socketId: string;
  } {
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

  function isPresent(boardId: string, socketId: string): boolean {
    return boardMembers.get(boardId)?.has(socketId) ?? false;
  }

  function listPresentBoardIds(socketId: string): string[] {
    const boardIds: string[] = [];
    for (const [boardId, members] of boardMembers) {
      if (members.has(socketId)) boardIds.push(boardId);
    }
    return boardIds;
  }

  return { joinBoard, leaveBoard, isPresent, listPresentBoardIds };
}

export type Presence = ReturnType<typeof createPresence>;
