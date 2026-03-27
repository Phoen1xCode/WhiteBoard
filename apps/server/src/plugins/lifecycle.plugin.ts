import { Elysia } from "elysia";
import { initRedis, getRedis, closeRedis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import {
  startBatchWriter,
  stopBatchWriter,
  recoverWal,
} from "../services/batch-writer";
import { compactBoard } from "../services/operation.service";
import { config } from "../config";

let compactionInterval: ReturnType<typeof setInterval>;

export const lifecyclePlugin = new Elysia({ name: "lifecycle" })
  .onStart(async () => {
    initRedis();
    await recoverWal();
    console.log("WAL crash recovery complete");

    startBatchWriter();
    console.log("BatchWriter started");

    compactionInterval = setInterval(async () => {
      try {
        const activeBoards = await getRedis().smembers("wal:active-boards");
        for (const boardId of activeBoards) {
          await compactBoard(boardId);
        }
      } catch (err) {
        console.error("Compaction error:", err);
      }
    }, config.COMPACTION_INTERVAL_SECONDS * 1000);
    console.log(
      `Compaction ticker started (every ${config.COMPACTION_INTERVAL_SECONDS}s)`,
    );
  })
  .onStop(async () => {
    await stopBatchWriter();
    console.log("BatchWriter flushed and stopped");

    clearInterval(compactionInterval);
    console.log("Compaction stopped");

    await closeRedis();
    console.log("Redis connections closed");

    await prisma.$disconnect();
    console.log("Prisma disconnected");
  });
