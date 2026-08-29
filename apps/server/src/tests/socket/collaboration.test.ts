import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CommittedOperation } from "@/services/operations";

const mocks = vi.hoisted(() => ({
  commitOperation: vi.fn(),
  getOperationsAfter: vi.fn(),
  isPresent: vi.fn(),
}));

vi.mock("@/services/operations", () => ({
  operationsService: {
    commitOperation: mocks.commitOperation,
    getOperationsAfter: mocks.getOperationsAfter,
  },
}));
vi.mock("@/socket/presence", () => ({
  presence: { isPresent: mocks.isPresent },
}));

import { collaboration } from "@/socket/collaboration";

const addOperation = {
  type: "add" as const,
  boardId: "board-1",
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

const committed: CommittedOperation = {
  id: "operation-1",
  boardId: "board-1",
  userId: "user-1",
  seq: 4,
  opType: "add",
  elementId: "element-1",
  clientOpId: "client-1",
  payload: addOperation,
  createdAt: "2026-01-01T00:00:00.000Z",
  created: true,
};

describe("socket collaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPresent.mockReturnValue(true);
    mocks.commitOperation.mockResolvedValue(committed);
    mocks.getOperationsAfter.mockResolvedValue([committed]);
  });

  it("rejects commits from sockets that have not joined the board", async () => {
    mocks.isPresent.mockReturnValue(false);

    await expect(
      collaboration.commitOnBoard({
        boardId: "board-1",
        userId: "user-1",
        socketId: "socket-1",
        operation: addOperation,
      }),
    ).rejects.toMatchObject({ status: 400, code: "NOT_JOINED" });
    expect(mocks.commitOperation).not.toHaveBeenCalled();
  });

  it("acknowledges and broadcasts a newly persisted operation", async () => {
    const result = await collaboration.commitOnBoard({
      boardId: "board-1",
      userId: "user-1",
      socketId: "socket-1",
      operation: addOperation,
      clientOpId: "client-1",
    });

    expect(mocks.commitOperation).toHaveBeenCalledWith({
      boardId: "board-1",
      userId: "user-1",
      operation: addOperation,
      clientOpId: "client-1",
    });
    expect(result.ack).toMatchObject({
      ok: true,
      clientOpId: "client-1",
      seq: 4,
      operation: { id: "operation-1" },
    });
    expect(result.ack.serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.broadcast).toEqual(result.ack.operation);
    expect(result.broadcast).not.toHaveProperty("created");
  });

  it("acks an idempotent retry without broadcasting it again", async () => {
    mocks.commitOperation.mockResolvedValue({ ...committed, created: false });

    const result = await collaboration.commitOnBoard({
      boardId: "board-1",
      userId: "user-1",
      socketId: "socket-1",
      operation: addOperation,
      clientOpId: "client-1",
    });

    expect(result.ack.ok).toBe(true);
    expect(result.broadcast).toBeNull();
  });

  it("replays ordered service results without leaking internal metadata", async () => {
    const result = await collaboration.replayOnBoard({
      boardId: "board-1",
      userId: "user-1",
      fromSeq: 3,
    });

    expect(mocks.getOperationsAfter).toHaveBeenCalledWith("board-1", 3, "user-1");
    expect(result).toMatchObject({ boardId: "board-1", fromSeq: 3 });
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).not.toHaveProperty("created");
  });
});
