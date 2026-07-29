import type { WhiteBoardOperation } from "@whiteboard/shared/types";

import { createServer } from "http";
import { Server } from "socket.io";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { signTokenPair } from "@/lib/jwt";
import { resetRedisForTests } from "@/lib/redis";

import { PermissionRole } from "../../prisma/generated/client";

const users = new Map<string, any>([
  [
    "user-1",
    {
      id: "user-1",
      email: "a@example.com",
      username: "alice",
      passwordHash: "x",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "viewer-1",
    {
      id: "viewer-1",
      email: "v@example.com",
      username: "viewer",
      passwordHash: "x",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
]);

const boards = new Map<string, any>([
  [
    "board-1",
    {
      id: "board-1",
      title: "Board",
      snapshot: { elements: [] },
      ownerId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
]);

const permissions = new Map<string, any>([
  ["board-1:user-1", { boardId: "board-1", userId: "user-1", role: PermissionRole.OWNER }],
  ["board-1:viewer-1", { boardId: "board-1", userId: "viewer-1", role: PermissionRole.VIEWER }],
]);

let seq = 0;
const operations: any[] = [];

vi.mock("../repositories/user-repository", () => ({
  findUserById: async (id: string) => users.get(id) ?? null,
}));

vi.mock("../repositories/board-repository", () => ({
  findBoardById: async (id: string) => boards.get(id) ?? null,
}));

vi.mock("../repositories/permission-repository", () => ({
  findPermission: async (boardId: string, userId: string) =>
    permissions.get(`${boardId}:${userId}`) ?? null,
}));

vi.mock("../services/operation-service", async () => {
  const { AppError } = await import("../lib/app-error");

  return {
    commitOperation: async (input: {
      boardId: string;
      userId: string;
      operation: WhiteBoardOperation;
      clientOpId?: string | null;
    }) => {
      const permission = permissions.get(`${input.boardId}:${input.userId}`);
      if (permission?.role !== PermissionRole.OWNER && permission?.role !== PermissionRole.EDITOR) {
        throw new AppError(403, "FORBIDDEN", "Editor permission is required");
      }

      if (input.clientOpId) {
        const existing = operations.find(
          (operation) =>
            operation.boardId === input.boardId && operation.clientOpId === input.clientOpId,
        );
        if (existing) {
          return { ...existing, created: false };
        }
      }

      seq += 1;
      const operation = {
        id: `op-${seq}`,
        boardId: input.boardId,
        userId: input.userId,
        seq,
        opType: input.operation.type,
        elementId:
          input.operation.type === "add"
            ? input.operation.element.id
            : input.operation.type === "clear"
              ? null
              : input.operation.elementId,
        clientOpId: input.clientOpId ?? null,
        payload: input.operation,
        createdAt: new Date().toISOString(),
        created: true,
      };
      operations.push(operation);
      return operation;
    },
    getOperationsAfter: async (boardId: string, fromSeq: number, userId: string) => {
      if (!permissions.has(`${boardId}:${userId}`)) {
        throw new AppError(403, "FORBIDDEN", "No permission to access this board");
      }
      return operations.filter(
        (operation) => operation.boardId === boardId && operation.seq > fromSeq,
      );
    },
  };
});

import { initSocket } from "@/sockets/socket";

function listen(io: Server): Promise<{ port: number; close: () => Promise<void> }> {
  const httpServer = io.httpServer!;
  return new Promise((resolve) => {
    httpServer.listen(0, () => {
      const address = httpServer.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({
        port,
        close: () =>
          new Promise((res, rej) => {
            io.close((err) => (err ? rej(err) : res()));
          }),
      });
    });
  });
}

function connectClient(port: number, token?: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioc(`http://127.0.0.1:${port}`, {
      auth: token ? { token } : {},
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });

    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

describe("socket protocol", () => {
  beforeEach(() => {
    resetRedisForTests();
    seq = 0;
    operations.length = 0;
    boards.get("board-1").snapshot = { elements: [] };
  });

  it("rejects connection without token", async () => {
    const httpServer = createServer();
    const io = new Server(httpServer, { cors: { origin: "*" } });
    initSocket(io);
    const { port, close } = await listen(io);

    await expect(connectClient(port)).rejects.toBeTruthy();
    await close();
  });

  it("join + commit ack + replay for editor; viewer cannot commit", async () => {
    const httpServer = createServer();
    const io = new Server(httpServer, { cors: { origin: "*" } });
    initSocket(io);
    const { port, close } = await listen(io);

    const editorToken = signTokenPair("user-1").accessToken;
    const viewerToken = signTokenPair("viewer-1").accessToken;

    const editor = await connectClient(port, editorToken);
    const viewer = await connectClient(port, viewerToken);

    const joinEditor = await new Promise<any>((resolve) => {
      editor.emit("board:join", { boardId: "board-1" }, resolve);
    });
    expect(joinEditor.ok).toBe(true);

    await new Promise<any>((resolve) => {
      viewer.emit("board:join", { boardId: "board-1" }, resolve);
    });

    const committedPromise = new Promise<any>((resolve) => {
      viewer.on("operation:committed", resolve);
    });

    const ack = await new Promise<any>((resolve) => {
      editor.emit(
        "operation:commit",
        {
          boardId: "board-1",
          clientOpId: "c1",
          operation: {
            type: "add",
            boardId: "board-1",
            element: {
              id: "e1",
              type: "rectangle",
              x: 1,
              y: 2,
              width: 3,
              height: 4,
              strokeColor: "#000",
              strokeWidth: 1,
            },
          },
        },
        resolve,
      );
    });

    expect(ack.ok).toBe(true);
    expect(ack.seq).toBe(1);
    expect(ack.clientOpId).toBe("c1");

    const broadcast = await committedPromise;
    expect(broadcast.seq).toBe(1);
    expect(broadcast.payload.element.id).toBe("e1");

    const viewerAck = await new Promise<any>((resolve) => {
      viewer.emit(
        "operation:commit",
        {
          boardId: "board-1",
          operation: {
            type: "clear",
            boardId: "board-1",
          },
        },
        resolve,
      );
    });
    expect(viewerAck.ok).toBe(false);
    expect(viewerAck.error.code).toBe("FORBIDDEN");

    const replay = await new Promise<any>((resolve) => {
      editor.emit("operation:replay", { boardId: "board-1", fromSeq: 0 }, resolve);
    });
    expect(replay.ok).toBe(true);
    expect(replay.operations).toHaveLength(1);
    expect(replay.operations[0].seq).toBe(1);

    let duplicateBroadcast = false;
    viewer.on("operation:committed", () => {
      duplicateBroadcast = true;
    });

    const idempotentAck = await new Promise<any>((resolve) => {
      editor.emit(
        "operation:commit",
        {
          boardId: "board-1",
          clientOpId: "c1",
          operation: {
            type: "add",
            boardId: "board-1",
            element: {
              id: "e1",
              type: "rectangle",
              x: 1,
              y: 2,
              width: 3,
              height: 4,
              strokeColor: "#000",
              strokeWidth: 1,
            },
          },
        },
        resolve,
      );
    });
    expect(idempotentAck.ok).toBe(true);
    expect(idempotentAck.seq).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(duplicateBroadcast).toBe(false);

    editor.close();
    viewer.close();
    await close();
  });
});
