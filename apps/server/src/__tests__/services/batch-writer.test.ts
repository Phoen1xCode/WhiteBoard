import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockRedis = {
  smembers: mock(() => Promise.resolve([])),
  call: mock(() => Promise.resolve(null)),
  srem: mock(() => Promise.resolve(1)),
  scanStream: mock(() => {
    const { Readable } = require("stream");
    return Readable.from([]);
  }),
  sadd: mock(() => Promise.resolve(1)),
};

const mockOperationRepo = {
  createMany: mock(() => Promise.resolve({ count: 0 })),
};

mock.module("../../lib/redis", () => ({
  getRedis: () => mockRedis,
}));

mock.module("../../repositories/operation.repository", () => mockOperationRepo);

import { drainOnce } from "../../services/batch-writer";

describe("batch-writer", () => {
  beforeEach(() => {
    mockRedis.smembers.mockReset();
    mockRedis.call.mockReset();
    mockRedis.srem.mockReset();
    mockOperationRepo.createMany.mockReset();
  });

  test("does nothing when no active boards", async () => {
    mockRedis.smembers.mockReturnValue(Promise.resolve([]));
    await drainOnce();
    expect(mockOperationRepo.createMany).not.toHaveBeenCalled();
  });

  test("drains WAL entries for active boards", async () => {
    mockRedis.smembers.mockReturnValue(Promise.resolve(["board-1"]));
    // First call() returns LMPOP result, second returns null (empty)
    mockRedis.call
      .mockReturnValueOnce(
        Promise.resolve([
          "wal:board:board-1",
          [
            JSON.stringify({ seq: 1, boardId: "board-1", userId: 1, opType: "add", elementId: "e1", payload: { id: "e1" } }),
          ],
        ]),
      )
      .mockReturnValueOnce(Promise.resolve(null));

    mockOperationRepo.createMany.mockReturnValue(Promise.resolve({ count: 1 }));

    await drainOnce();

    expect(mockOperationRepo.createMany).toHaveBeenCalledTimes(1);
    expect(mockRedis.srem).toHaveBeenCalledWith("wal:active-boards", "board-1");
  });
});
