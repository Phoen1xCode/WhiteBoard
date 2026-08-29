import type { AckResult, BoardJoinedPayload } from "@whiteboard/shared/types/socket";
import type { AddressInfo } from "node:net";

import { createServer, type Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  commitOperation: vi.fn(),
  getOperationsAfter: vi.fn(),
  requireBoardView: vi.fn(),
  resolveAccessToken: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ resolveAccessToken: mocks.resolveAccessToken }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/services/boards", () => ({ requireBoardView: mocks.requireBoardView }));
vi.mock("@/services/operations", () => ({
  operationsService: {
    commitOperation: mocks.commitOperation,
    getOperationsAfter: mocks.getOperationsAfter,
  },
}));

import { registerSocketServer } from "@/socket";

const alice = { id: "user-1", email: "alice@example.com", username: "alice" };
const bob = { id: "user-2", email: "bob@example.com", username: "bob" };
const operation = {
  type: "add" as const,
  boardId: "board-socket",
  element: {
    id: "element-1",
    type: "rectangle" as const,
    x: 1,
    y: 2,
    width: 10,
    height: 20,
    strokeColor: "#000000",
    strokeWidth: 1,
  },
};

let httpServer: HttpServer;
let ioServer: SocketServer;
let baseUrl: string;
let disconnectUserSockets: (userId: string) => void;
const clients: ClientSocket[] = [];

function onceSocket<T extends unknown[]>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (...args: unknown[]) => resolve(args as T));
  });
}

async function connect(token?: string): Promise<ClientSocket> {
  const socket = createClient(baseUrl, {
    auth: token ? { token } : {},
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
  });
  clients.push(socket);
  if (token) await onceSocket(socket, "connect");
  return socket;
}

async function closeServer(): Promise<void> {
  for (const client of clients.splice(0)) client.disconnect();
  await new Promise<void>((resolve) => ioServer.close(() => resolve()));
  if (httpServer.listening) {
    await new Promise<void>((resolve, reject) =>
      httpServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

describe("Socket.IO server", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.resolveAccessToken.mockImplementation(async (token: string) => ({
      token,
      user: token === "bob-token" ? bob : alice,
    }));
    mocks.requireBoardView.mockResolvedValue({ id: "board-socket" });
    mocks.checkRateLimit.mockResolvedValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      retryAfterMs: 0,
    });
    mocks.commitOperation.mockImplementation(async ({ userId, clientOpId }) => ({
      id: "operation-1",
      boardId: "board-socket",
      userId,
      seq: 1,
      opType: "add",
      elementId: "element-1",
      clientOpId,
      payload: operation,
      createdAt: "2026-01-01T00:00:00.000Z",
      created: true,
    }));
    mocks.getOperationsAfter.mockResolvedValue([]);

    httpServer = createServer();
    ioServer = new SocketServer(httpServer);
    ({ disconnectUserSockets } = registerSocketServer(ioServer));
    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(closeServer);

  it("rejects a connection without an access token", async () => {
    const socket = await connect();
    const [error] = await onceSocket<[Error]>(socket, "connect_error");

    expect(error.message).toBe("UNAUTHORIZED");
    expect(mocks.resolveAccessToken).not.toHaveBeenCalled();
  });

  it("joins real rooms and relays presence, cursors and committed operations", async () => {
    const aliceSocket = await connect("alice-token");
    const bobSocket = await connect("bob-token");

    const aliceJoin = (await aliceSocket.emitWithAck("board:join", {
      boardId: "board-socket",
    })) as AckResult<BoardJoinedPayload>;
    expect(aliceJoin).toMatchObject({ ok: true, members: [alice] });

    const userJoined = onceSocket(aliceSocket, "board:user-joined");
    const bobJoin = (await bobSocket.emitWithAck("board:join", {
      boardId: "board-socket",
    })) as AckResult<BoardJoinedPayload>;
    expect(bobJoin).toMatchObject({ ok: true, members: [alice, bob] });
    await expect(userJoined).resolves.toEqual([{ boardId: "board-socket", user: bob }]);

    const cursorUpdated = onceSocket(aliceSocket, "cursor:updated");
    bobSocket.emit("cursor:update", { boardId: "board-socket", x: 42, y: 24 });
    await expect(cursorUpdated).resolves.toEqual([
      expect.objectContaining({
        boardId: "board-socket",
        userId: bob.id,
        username: bob.username,
        x: 42,
        y: 24,
      }),
    ]);

    const committed = onceSocket(aliceSocket, "operation:committed");
    const ack = await bobSocket.emitWithAck("operation:commit", {
      boardId: "board-socket",
      operation,
      clientOpId: "client-1",
    });
    expect(ack).toMatchObject({ ok: true, seq: 1, clientOpId: "client-1" });
    await expect(committed).resolves.toEqual([
      expect.objectContaining({ id: "operation-1", userId: bob.id, seq: 1 }),
    ]);
  });

  it("maps validation failures to ack errors and disconnects all user sockets on logout", async () => {
    const socket = await connect("alice-token");

    const ack = await socket.emitWithAck("operation:replay", {
      boardId: "board-socket",
      fromSeq: -1,
    });
    expect(ack).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR" },
    });

    const disconnected = onceSocket(socket, "disconnect");
    disconnectUserSockets(alice.id);
    await expect(disconnected).resolves.toBeDefined();
  });
});
