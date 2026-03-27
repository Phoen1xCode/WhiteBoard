import { config } from "./config";
import { initRedis, closeRedis } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { handleCors, addCorsHeaders } from "./middleware/cors";
import { handleAuthRoute } from "./handlers/auth.handler";
import { handleBoardRoute } from "./handlers/board.handler";
import { startBatchWriter, stopBatchWriter, recoverWal } from "./services/batch-writer";
import { compactBoard } from "./services/operation.service";
import { jsonError } from "./lib/response";
import type { WsData } from "./ws/socket";
import { wsHandlers } from "./ws/socket";

// --- Initialize subsystems ---

// Redis (all ioredis — standard client + dedicated Pub/Sub subscriber)
const { redis } = initRedis();

// Crash recovery: drain any leftover WAL entries
await recoverWal();
console.log("WAL crash recovery complete");

// Start batch writer (WAL → DB every 100ms)
startBatchWriter();
console.log("BatchWriter started");

// Start compaction ticker
const compactionInterval = setInterval(async () => {
  try {
    const activeBoards = await redis.smembers("wal:active-boards");
    for (const boardId of activeBoards) {
      await compactBoard(boardId);
    }
  } catch (err) {
    console.error("Compaction error:", err);
  }
}, config.COMPACTION_INTERVAL_SECONDS * 1000);
console.log(`Compaction ticker started (every ${config.COMPACTION_INTERVAL_SECONDS}s)`);

// --- HTTP Server ---

const server = Bun.serve<WsData>({
  port: config.PORT,

  async fetch(req, server) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // WebSocket upgrade at /ws
    if (pathname === "/ws") {
      const clientId = crypto.randomUUID();
      const upgraded = server.upgrade(req, { data: { clientId, boardId: null } });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Health check
    if (req.method === "GET" && pathname === "/health") {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            status: "ok",
            uptime: process.uptime(),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }

    // Route dispatching
    try {
      // Auth routes (some don't require auth)
      const authResponse = await handleAuthRoute(req, pathname);
      if (authResponse) return addCorsHeaders(authResponse);

      // Board routes (all require auth)
      const boardResponse = await handleBoardRoute(req, pathname);
      if (boardResponse) return addCorsHeaders(boardResponse);

      return addCorsHeaders(jsonError(404, "Not Found"));
    } catch (err) {
      console.error("Unhandled request error:", err);
      return addCorsHeaders(jsonError(500, "Internal Server Error"));
    }
  },

  websocket: {
    ...wsHandlers,
    idleTimeout: 120,
    maxPayloadLength: config.WS_MAX_PAYLOAD_BYTES,
  },
});

console.log(`Server running on http://localhost:${server.port}`);

// --- Graceful Shutdown ---

const SHUTDOWN_TIMEOUT = 30_000;

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);

  const timeout = setTimeout(() => {
    console.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Stop accepting new connections
    server.stop();
    console.log("Server stopped accepting connections");

    // Flush batch writer
    await stopBatchWriter();
    console.log("BatchWriter flushed and stopped");

    // Stop compaction
    clearInterval(compactionInterval);
    console.log("Compaction stopped");

    // Close Redis
    await closeRedis();
    console.log("Redis connections closed");

    // Disconnect Prisma
    await prisma.$disconnect();
    console.log("Prisma disconnected");

    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    console.error("Shutdown error:", err);
    clearTimeout(timeout);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
