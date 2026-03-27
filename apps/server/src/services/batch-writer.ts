import { getRedis } from "../lib/redis";
import * as operationRepo from "../repositories/operation.repository";

const BATCH_SIZE = 100;

/**
 * Single drain pass: pop WAL entries from Redis and INSERT into PostgreSQL.
 * Exported for testing and for crash recovery on startup.
 */
export async function drainOnce(): Promise<void> {
  const redis = getRedis();

  const activeBoards = await redis.smembers("wal:active-boards");
  if (activeBoards.length === 0) return;

  for (const boardId of activeBoards) {
    let drained = false;

    // Drain all available entries for this board
    // LMPOP is Redis 7+ — ioredis doesn't have a native method, so we use call()
    while (true) {
      const result = await redis.call(
        "LMPOP", "1", `wal:board:${boardId}`, "LEFT", "COUNT", String(BATCH_SIZE),
      ) as [string, string[]] | null;
      if (!result) {
        drained = true;
        break;
      }

      const [, entries] = result;
      if (!entries || entries.length === 0) {
        drained = true;
        break;
      }

      const rows = entries.map((raw: string) => {
        const entry = JSON.parse(raw);
        return {
          boardId: entry.boardId,
          userId: entry.userId,
          seq: entry.seq,
          opType: entry.opType,
          elementId: entry.elementId ?? null,
          payload: entry.payload ?? undefined,
        };
      });

      await operationRepo.createMany(rows);

      if (entries.length < BATCH_SIZE) {
        drained = true;
        break;
      }
    }

    if (drained) {
      await redis.srem("wal:active-boards", boardId);
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the background batch writer that drains WAL every 100ms.
 */
export function startBatchWriter(): void {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    try {
      await drainOnce();
    } catch (err) {
      console.error("BatchWriter error:", err);
    }
  }, 100);
}

/**
 * Stop the batch writer and do a final drain.
 */
export async function stopBatchWriter(): Promise<void> {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  // Final drain on shutdown
  try {
    await drainOnce();
  } catch (err) {
    console.error("BatchWriter final drain error:", err);
  }
}

/**
 * Crash recovery: drain any leftover WAL entries on startup.
 * Scans for wal:board:* keys and also checks wal:active-boards set.
 */
export async function recoverWal(): Promise<void> {
  const redis = getRedis();

  // Scan for any orphaned WAL keys not in the active set
  await new Promise<void>((resolve, reject) => {
    const stream = redis.scanStream({ match: "wal:board:*", count: 100 });
    stream.on("data", async (keys: string[]) => {
      for (const key of keys) {
        const boardId = key.slice("wal:board:".length);
        await redis.sadd("wal:active-boards", boardId);
      }
    });
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  // Now drain everything
  await drainOnce();
}
