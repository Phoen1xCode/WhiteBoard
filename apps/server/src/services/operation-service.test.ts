import type { WhiteBoardElement, WhiteBoardOperation } from "@whiteboard/shared/types";

import { beforeEach, describe, expect, it, vi } from "vitest";

interface TestBoard {
  id: string;
  snapshot: unknown;
}

interface TestOperation {
  id: string;
  boardId: string;
  userId: string | null;
  seq: number;
  opType: string;
  elementId: string | null;
  clientOpId: string | null;
  payload: unknown;
  createdAt: Date;
}

const store = vi.hoisted(() => ({
  boards: new Map<string, TestBoard>(),
  operations: [] as TestOperation[],
  editors: new Set<string>(),
  viewers: new Set<string>(),
}));

function forbidden(): Error {
  return Object.assign(new Error("Forbidden"), { status: 403, code: "FORBIDDEN" });
}

vi.mock("./boardsService", () => ({
  assertCanEditBoard: async (boardId: string, userId: string) => {
    if (!store.editors.has(`${boardId}:${userId}`)) {
      throw forbidden();
    }
    return store.boards.get(boardId);
  },
  assertCanAccessBoard: async (boardId: string, userId: string) => {
    if (!store.viewers.has(`${boardId}:${userId}`)) {
      throw forbidden();
    }
    return store.boards.get(boardId);
  },
}));

vi.mock("../lib/prisma", () => {
  const findFirst = async (args: {
    where: { boardId: string; clientOpId?: string | null };
    orderBy?: { seq: "desc" };
  }): Promise<TestOperation | null> => {
    const matches = store.operations.filter(
      (operation) => operation.boardId === args.where.boardId,
    );

    if (args.where.clientOpId) {
      return matches.find((operation) => operation.clientOpId === args.where.clientOpId) ?? null;
    }

    return matches.sort((left, right) => right.seq - left.seq)[0] ?? null;
  };

  const transactionClient = {
    $queryRaw: async (_query: TemplateStringsArray, boardId: string) => {
      const board = store.boards.get(boardId);
      return board ? [board] : [];
    },
    operation: {
      findFirst,
      create: async (args: {
        data: Omit<TestOperation, "id" | "createdAt">;
      }): Promise<TestOperation> => {
        const operation = {
          id: `op-${store.operations.length + 1}`,
          ...args.data,
          createdAt: new Date(),
        };
        store.operations.push(operation);
        return operation;
      },
    },
    board: {
      update: async (args: { where: { id: string }; data: { snapshot: unknown } }) => {
        const board = store.boards.get(args.where.id);
        if (!board) {
          throw new Error("Board not found");
        }
        board.snapshot = args.data.snapshot;
        return board;
      },
    },
  };

  return {
    prisma: {
      $transaction: async <T>(run: (transaction: typeof transactionClient) => Promise<T>) =>
        await run(transactionClient),
      operation: {
        findFirst,
        findMany: async (args: {
          where: { boardId: string; seq: { gt: number } };
        }): Promise<TestOperation[]> =>
          store.operations
            .filter(
              (operation) =>
                operation.boardId === args.where.boardId && operation.seq > args.where.seq.gt,
            )
            .sort((left, right) => left.seq - right.seq),
      },
    },
  };
});

import { commitOperation, getOperationsAfter } from "@/services/operation-service";

const rect = (id: string, x = 0): WhiteBoardElement => ({
  id,
  type: "rectangle",
  x,
  y: 0,
  width: 10,
  height: 10,
  strokeColor: "#000",
  strokeWidth: 1,
});

async function commit(operation: WhiteBoardOperation, clientOpId: string) {
  return await commitOperation({
    boardId: "b1",
    operation,
    userId: "owner-1",
    clientOpId,
  });
}

describe("operation module", () => {
  beforeEach(() => {
    store.boards.clear();
    store.operations.length = 0;
    store.editors.clear();
    store.viewers.clear();
    store.boards.set("b1", { id: "b1", snapshot: { elements: [] } });
    store.editors.add("b1:owner-1");
    store.viewers.add("b1:owner-1");
    store.viewers.add("b1:viewer-1");
  });

  it("commits, reduces state, and deduplicates clientOpId", async () => {
    const added = await commit({ type: "add", boardId: "b1", element: rect("e1") }, "client-1");
    const updated = await commit(
      { type: "update", boardId: "b1", elementId: "e1", changes: { x: 99 } },
      "client-2",
    );
    const duplicate = await commit({ type: "add", boardId: "b1", element: rect("e1") }, "client-1");

    expect(added).toMatchObject({ seq: 1, created: true });
    expect(updated).toMatchObject({ seq: 2, created: true });
    expect(duplicate).toMatchObject({ seq: 1, created: false });
    expect(store.operations).toHaveLength(2);
    expect(store.boards.get("b1")?.snapshot).toMatchObject({
      elements: [{ id: "e1", x: 99 }],
    });
  });

  it("owns validation and edit authorization", async () => {
    await expect(
      commitOperation({
        boardId: "b1",
        operation: { type: "clear", boardId: "other" },
        userId: "owner-1",
      }),
    ).rejects.toMatchObject({ code: "INVALID_OPERATION", status: 400 });

    await expect(
      commitOperation({
        boardId: "b1",
        operation: { type: "clear", boardId: "b1" },
        userId: "viewer-1",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });

    expect(store.operations).toHaveLength(0);
  });

  it("authorizes and returns operations after a sequence", async () => {
    await commit({ type: "add", boardId: "b1", element: rect("e1") }, "client-1");
    await commit({ type: "delete", boardId: "b1", elementId: "e1" }, "client-2");

    await expect(getOperationsAfter("b1", 1, "owner-1")).resolves.toMatchObject([
      { seq: 2, opType: "delete" },
    ]);
    await expect(getOperationsAfter("b1", 0, "stranger")).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});
