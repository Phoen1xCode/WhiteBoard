import { getRedis } from "../lib/redis";
import * as operationRepo from "../repositories/operation.repository";
import * as snapshotRepo from "../repositories/snapshot.repository";
import { config } from "../config";

/**
 * Pure function: replays a list of operations onto an elements map.
 * Used by both getBoardState (read path) and snapshot compaction.
 */
export function replayOps(
  elements: Map<string, any>,
  ops: { opType: string; elementId: string | null; payload: any }[],
): Map<string, any> {
  for (const op of ops) {
    switch (op.opType) {
      case "add":
        if (op.elementId && op.payload) elements.set(op.elementId, op.payload);
        break;
      case "update":
        if (op.elementId && op.payload) {
          const existing = elements.get(op.elementId);
          if (existing) elements.set(op.elementId, { ...existing, ...op.payload });
        }
        break;
      case "delete":
        if (op.elementId) elements.delete(op.elementId);
        break;
      case "clear":
        elements.clear();
        break;
    }
  }
  return elements;
}

/**
 * Write path: append an operation via Redis WAL.
 * Returns the assigned sequence number.
 */
export async function appendOperation(
  boardId: string,
  userId: number,
  opType: string,
  elementId: string | null,
  payload: any,
): Promise<number> {
  const redis = getRedis();

  // Atomic sequence number
  const seq = await redis.incr(`board:${boardId}:seq`);

  // WAL entry
  const entry = JSON.stringify({ seq, boardId, userId, opType, elementId, payload });
  await redis.rpush(`wal:board:${boardId}`, entry);

  // Register board for batch writer discovery
  await redis.sadd("wal:active-boards", boardId);

  // Invalidate state cache
  await redis.del(`board:${boardId}:state`);

  return seq;
}

/**
 * Read path: get current board state (elements + currentSeq).
 * Checks Redis cache first, falls back to snapshot + replay.
 */
export async function getBoardState(
  boardId: string,
): Promise<{ elements: Record<string, any>; currentSeq: number }> {
  const redis = getRedis();

  // Check cache
  try {
    const cached = await redis.get(`board:${boardId}:state`);
    if (cached) return JSON.parse(cached);
  } catch {
    // Redis unavailable — fall through to DB
  }

  // Load latest snapshot
  const snapshot = await snapshotRepo.findLatest(boardId);
  const snapshotSeq = snapshot?.seq ?? 0;
  const snapshotData = (snapshot?.data as Record<string, any>) ?? {};

  // Build elements map from snapshot
  const elements = new Map<string, any>();
  for (const [id, el] of Object.entries(snapshotData)) {
    elements.set(id, el);
  }

  // Load and replay operations after snapshot
  const ops = await operationRepo.findAfterSeq(boardId, snapshotSeq);
  replayOps(elements, ops);

  // Determine current seq
  const currentSeq = ops.length > 0 ? ops[ops.length - 1].seq : snapshotSeq;

  // Convert to plain object
  const state = {
    elements: Object.fromEntries(elements),
    currentSeq,
  };

  // Cache in Redis (10 min TTL)
  try {
    await redis.set(`board:${boardId}:state`, JSON.stringify(state), "EX", 600);
  } catch {
    // Redis unavailable — skip caching
  }

  return state;
}

/**
 * Snapshot compaction: called by background ticker.
 * Compacts boards with > COMPACTION_THRESHOLD ops since last snapshot.
 */
export async function compactBoard(boardId: string): Promise<boolean> {
  const snapshot = await snapshotRepo.findLatest(boardId);
  const snapshotSeq = snapshot?.seq ?? 0;

  const opsCount = await operationRepo.countAfterSeq(boardId, snapshotSeq);
  if (opsCount < config.COMPACTION_THRESHOLD) return false;

  // Load snapshot data
  const snapshotData = (snapshot?.data as Record<string, any>) ?? {};
  const elements = new Map<string, any>();
  for (const [id, el] of Object.entries(snapshotData)) {
    elements.set(id, el);
  }

  // Load and replay all ops after snapshot
  const ops = await operationRepo.findAfterSeq(boardId, snapshotSeq);
  if (ops.length === 0) return false;

  replayOps(elements, ops);

  const newSeq = ops[ops.length - 1].seq;

  // Save new snapshot
  await snapshotRepo.create({
    boardId,
    seq: newSeq,
    data: Object.fromEntries(elements),
  });

  // Delete old operations (older than 30 days, covered by a snapshot)
  await operationRepo.deleteOlderThan(boardId, newSeq, 30);

  // Invalidate cache
  try {
    const redis = getRedis();
    await redis.del(`board:${boardId}:state`);
  } catch {
    // Redis unavailable — cache will expire naturally
  }

  return true;
}
