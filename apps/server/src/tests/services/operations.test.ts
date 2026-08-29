import type { WhiteBoardOperation } from "@whiteboard/shared/types";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  boardUpdate: vi.fn(),
  operationCreate: vi.fn(),
  operationFindFirst: vi.fn(),
  operationFindMany: vi.fn(),
  outsideOperationFindFirst: vi.fn(),
  queryRaw: vi.fn(),
  requireBoardEdit: vi.fn(),
  requireBoardView: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    operation: {
      findFirst: mocks.outsideOperationFindFirst,
      findMany: mocks.operationFindMany,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/services/boards", () => ({
  requireBoardEdit: mocks.requireBoardEdit,
  requireBoardView: mocks.requireBoardView,
}));

import { operationsService } from "@/services/operations";

const element = {
  id: "element-1",
  type: "rectangle" as const,
  x: 1,
  y: 2,
  width: 20,
  height: 10,
  strokeColor: "#000000",
  strokeWidth: 1,
};
const addOperation: WhiteBoardOperation = {
  type: "add",
  boardId: "board-1",
  element,
};
const createdAt = new Date("2026-01-01T00:00:00.000Z");
const record = {
  id: "operation-1",
  boardId: "board-1",
  userId: "user-1",
  seq: 3,
  opType: "add",
  elementId: "element-1",
  clientOpId: "client-1",
  payload: addOperation,
  createdAt,
};
const transactionClient = {
  board: { update: mocks.boardUpdate },
  operation: {
    create: mocks.operationCreate,
    findFirst: mocks.operationFindFirst,
  },
  $queryRaw: mocks.queryRaw,
};

describe("operations service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireBoardEdit.mockResolvedValue({ id: "board-1" });
    mocks.requireBoardView.mockResolvedValue({ id: "board-1" });
    mocks.queryRaw.mockResolvedValue([{ id: "board-1", snapshot: { elements: [] } }]);
    mocks.operationFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ seq: 2 });
    mocks.operationCreate.mockResolvedValue(record);
    mocks.boardUpdate.mockResolvedValue({ id: "board-1" });
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => unknown) => callback(transactionClient),
    );
  });

  it("rejects malformed and cross-board operations before checking permissions", async () => {
    await expect(
      operationsService.commitOperation({
        boardId: "board-1",
        userId: "user-1",
        operation: { type: "delete", boardId: "board-1", elementId: "" },
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_OPERATION" });

    await expect(
      operationsService.commitOperation({
        boardId: "board-1",
        userId: "user-1",
        operation: { ...addOperation, boardId: "board-2" },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_OPERATION",
      message: "Operation boardId mismatch",
    });
    expect(mocks.requireBoardEdit).not.toHaveBeenCalled();
  });

  it("persists an operation and snapshot atomically with the next sequence", async () => {
    const result = await operationsService.commitOperation({
      boardId: "board-1",
      userId: "user-1",
      operation: addOperation,
      clientOpId: "client-1",
    });

    expect(mocks.requireBoardEdit).toHaveBeenCalledWith("board-1", "user-1");
    expect(mocks.operationCreate).toHaveBeenCalledWith({
      data: {
        boardId: "board-1",
        seq: 3,
        opType: "add",
        payload: addOperation,
        userId: "user-1",
        elementId: "element-1",
        clientOpId: "client-1",
      },
    });
    expect(mocks.boardUpdate).toHaveBeenCalledWith({
      where: { id: "board-1" },
      data: { snapshot: { elements: [element] } },
    });
    expect(result).toEqual({
      ...record,
      createdAt: createdAt.toISOString(),
      created: true,
    });
  });

  it("returns an existing idempotent operation without changing the snapshot", async () => {
    mocks.operationFindFirst.mockReset().mockResolvedValue(record);

    const result = await operationsService.commitOperation({
      boardId: "board-1",
      userId: "user-1",
      operation: addOperation,
      clientOpId: "client-1",
    });

    expect(result.created).toBe(false);
    expect(mocks.operationCreate).not.toHaveBeenCalled();
    expect(mocks.boardUpdate).not.toHaveBeenCalled();
  });

  it("recovers an idempotent result after a concurrent unique-key conflict", async () => {
    mocks.transaction.mockRejectedValueOnce({ code: "P2002" });
    mocks.outsideOperationFindFirst.mockResolvedValue(record);

    const result = await operationsService.commitOperation({
      boardId: "board-1",
      userId: "user-1",
      operation: addOperation,
      clientOpId: "client-1",
    });

    expect(mocks.outsideOperationFindFirst).toHaveBeenCalledWith({
      where: { boardId: "board-1", clientOpId: "client-1" },
    });
    expect(result.created).toBe(false);
  });

  it("authorizes replay and returns operations ordered by sequence", async () => {
    const secondRecord = { ...record, id: "operation-2", seq: 4, clientOpId: "client-2" };
    mocks.operationFindMany.mockResolvedValue([record, secondRecord]);

    const result = await operationsService.getOperationsAfter("board-1", 2, "user-1");

    expect(mocks.requireBoardView).toHaveBeenCalledWith("board-1", "user-1");
    expect(mocks.operationFindMany).toHaveBeenCalledWith({
      where: { boardId: "board-1", seq: { gt: 2 } },
      orderBy: { seq: "asc" },
    });
    expect(result.map((operation) => operation.seq)).toEqual([3, 4]);
  });
});
