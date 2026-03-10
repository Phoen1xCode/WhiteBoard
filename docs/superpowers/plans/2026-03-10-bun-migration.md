# Bun Runtime 全量迁移 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the WhiteBoard monorepo from Node.js/yarn/Koa/Socket.IO to a Bun-native stack with `Bun.serve()` unified HTTP + WebSocket.

**Architecture:** Replace `yarn` with `bun` as package manager and runtime (native TypeScript, no `tsx`). Rewrite the backend around `Bun.serve()`, eliminating Koa and Socket.IO entirely. The frontend socket client is rewritten to use the browser-native `WebSocket` API while keeping an identical public interface so all callers remain unchanged.

**Tech Stack:** Bun 1.x, Prisma 6 (`engineType = "library"`), React 19, Vite 7, Zustand, Konva.js

**Spec:** `docs/superpowers/specs/2026-03-10-bun-migration-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `yarn.lock` | Delete | — |
| `package.json` (root) | Modify | Remove `concurrently`, update `dev:web` script |
| `apps/server/package.json` | Modify | Remove Koa/Socket.IO/tsx deps, update scripts |
| `apps/server/prisma/schema.prisma` | Modify | Add `engineType = "library"` to generator |
| `packages/shared/src/types/ws.ts` | **Create** | `WsClientMessage` + `WsServerMessage` discriminated unions |
| `packages/shared/src/index.ts` | **Create** | Re-exports from `types/whiteboard` + `types/ws` |
| `packages/shared/package.json` | Modify | Add `"./types/ws"` to exports map |
| `apps/server/src/ws/socket.ts` | Rewrite | Bun `ServerWebSocket` pub/sub handlers (replaces Socket.IO) |
| `apps/server/src/routes/boards.ts` | Rewrite | REST handlers using `Request`/`Response` (absorbs controller) |
| `apps/server/src/controllers/boardsController.ts` | **Delete** | Logic absorbed into routes/boards.ts |
| `apps/server/src/index.ts` | Rewrite | `Bun.serve()` entry point — HTTP + WS routing + CORS |
| `apps/web/src/lib/socket.ts` | Rewrite | Native WebSocket client (identical public API, no socket.io-client) |
| `apps/web/src/hooks/useCursors.ts` | Modify | Remove redundant self-cursor filter (server pub/sub already excludes sender) |

**Unchanged:** `apps/server/src/services/boardsService.ts`, `apps/server/src/prisma/client.ts`, all other frontend files.

---

## Chunk 1: Foundation — Toolchain, Dependencies & Shared Types

### Task 1: Migrate package manager (yarn → bun)

**Files:**
- Delete: `yarn.lock`
- Modify: `package.json` (root)

- [ ] **Step 1: Delete yarn.lock**

```bash
rm yarn.lock
```

- [ ] **Step 2: Rewrite root `package.json`**

Remove `concurrently` devDep and update the `dev:web` script:

```json
{
  "name": "whiteboard",
  "private": true,
  "version": "0.0.1",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:web": "bun run --cwd apps/web dev"
  }
}
```

- [ ] **Step 3: Run `bun install`**

```bash
bun install
```

Expected: `bun.lockb` created, all workspace deps installed, no errors.

- [ ] **Step 4: Verify Vite starts**

```bash
bun run dev:web
```

Expected: output includes `VITE v7.x.x  ready in ... ms` on port 5173.
Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lockb
git rm yarn.lock
git commit -m "chore: migrate package manager from yarn to bun, remove concurrently"
```

---

### Task 2: Add shared WebSocket message types

**Files:**
- Create: `packages/shared/src/types/ws.ts`
- Create: `packages/shared/src/index.ts`
- Modify: `packages/shared/package.json`

- [ ] **Step 1: Create `packages/shared/src/types/ws.ts`**

```typescript
import type { WhiteBoardOperation } from "./whiteboard";

/** Client → Server */
export type WsClientMessage =
  | { type: "join-board"; boardId: string }
  | { type: "leave-board"; boardId: string }
  | { type: "op"; data: WhiteBoardOperation }
  | { type: "cursor"; boardId: string; x: number; y: number };

/** Server → Client */
export type WsServerMessage =
  | { type: "op"; data: WhiteBoardOperation }
  | { type: "cursor"; boardId: string; clientId: string; x: number; y: number };
```

- [ ] **Step 2: Create `packages/shared/src/index.ts`**

This file does not currently exist on disk. Create it:

```typescript
export * from "./types/whiteboard";
export * from "./types/ws";
```

- [ ] **Step 3: Update `packages/shared/package.json`**

Add the `"./types/ws"` entry to the `exports` map:

```json
{
  "name": "@whiteboard/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/whiteboard.ts",
    "./types/ws": "./src/types/ws.ts",
    "./schemas": "./src/schemas/board.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd packages/shared && bunx tsc --noEmit
```

Expected: exits with code 0, no errors. (`tsconfig.json` already exists in this package; if missing for any reason, check that `packages/shared/tsconfig.json` exists before proceeding.)

- [ ] **Step 5: Commit**

```bash
# from repo root
git add packages/shared/src/types/ws.ts packages/shared/src/index.ts packages/shared/package.json
git commit -m "feat(shared): add WsClientMessage and WsServerMessage protocol types"
```

---

### Task 3: Update server deps + Prisma schema

**Files:**
- Modify: `apps/server/package.json`
- Modify: `apps/server/prisma/schema.prisma`

- [ ] **Step 1: Rewrite `apps/server/package.json`**

Remove all Koa, Socket.IO, and `tsx` packages. Update scripts to use `bun`:

```json
{
  "name": "@whiteboard/server",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev":             "bun --hot src/index.ts",
    "start":           "bun src/index.ts",
    "lint":            "eslint .",
    "prisma:generate": "prisma generate",
    "prisma:migrate":  "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^6.19.0"
  },
  "devDependencies": {
    "prisma":     "^6.19.0",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Update `apps/server/prisma/schema.prisma`**

Add `engineType = "library"` for Bun compatibility:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider   = "prisma-client-js"
  engineType = "library"
}

model Board {
  id        String   @id @default(cuid())
  title     String
  snapshot  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 3: Update lockfile**

```bash
# from repo root
bun install
```

Expected: `bun.lockb` updated, removed packages gone from node_modules. No errors.

- [ ] **Step 4: Regenerate Prisma client**

```bash
cd apps/server && bun run prisma:generate
```

Expected: output ends with `✔ Generated Prisma Client (v6.x.x) ...`. No errors.

- [ ] **Step 5: Commit**

```bash
# from repo root
git add apps/server/package.json apps/server/prisma/schema.prisma bun.lockb
git commit -m "chore(server): remove Koa/Socket.IO/tsx deps, configure Prisma library engine for Bun"
```

---

## Chunk 2: Backend Rewrite

### Task 4: Rewrite WebSocket handler

**Files:**
- Modify: `apps/server/src/ws/socket.ts`

- [ ] **Step 1: Rewrite `apps/server/src/ws/socket.ts`**

Replace the entire file:

```typescript
import type { ServerWebSocket } from "bun";
import type { WsClientMessage, WsServerMessage } from "@whiteboard/shared/types/ws";
import { applyOperationToSnapshot } from "../services/boardsService";

export type WsData = { clientId: string; boardId: string | null };

export const wsHandlers = {
  open(ws: ServerWebSocket<WsData>) {
    console.log("client connected", ws.data.clientId);
  },

  async message(ws: ServerWebSocket<WsData>, raw: string | Buffer) {
    let msg: WsClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      console.warn("Received malformed WS message, ignoring.");
      return;
    }

    switch (msg.type) {
      case "join-board":
        ws.data.boardId = msg.boardId;
        ws.subscribe(msg.boardId);
        break;

      case "leave-board":
        ws.unsubscribe(msg.boardId);
        ws.data.boardId = null;
        break;

      case "op": {
        const outbound: WsServerMessage = { type: "op", data: msg.data };
        // ws.publish excludes the sender — equivalent to socket.to(room).emit()
        // boardId is taken from the operation payload; a well-behaved client
        // should only send ops for the board they joined. Enforcing this is
        // out of scope for this migration.
        ws.publish(msg.data.boardId, JSON.stringify(outbound));
        try {
          await applyOperationToSnapshot(msg.data.boardId, msg.data);
        } catch (err) {
          console.error("Failed to persist operation:", err);
        }
        break;
      }

      case "cursor": {
        const outbound: WsServerMessage = {
          type: "cursor",
          boardId: msg.boardId,
          clientId: ws.data.clientId,
          x: msg.x,
          y: msg.y,
        };
        ws.publish(msg.boardId, JSON.stringify(outbound));
        break;
      }
    }
  },

  close(ws: ServerWebSocket<WsData>) {
    console.log("client disconnected", ws.data.clientId);
    if (ws.data.boardId) ws.unsubscribe(ws.data.boardId);
  },
};
```

- [ ] **Step 2: Type-check ws/socket.ts**

```bash
cd apps/server && bunx tsc --noEmit --skipLibCheck 2>&1 | grep "ws/socket"
```

Expected: no lines output (no errors in this file).
Note: errors about `src/index.ts` still importing from Koa are expected — index.ts is rewritten in Task 6.

- [ ] **Step 3: Commit**

```bash
cd ..
git add apps/server/src/ws/socket.ts
git commit -m "feat(server): rewrite WebSocket handler using Bun native pub/sub"
```

---

### Task 5: Rewrite HTTP route handler

**Files:**
- Modify: `apps/server/src/routes/boards.ts`
- Delete: `apps/server/src/controllers/boardsController.ts`

- [ ] **Step 1: Rewrite `apps/server/src/routes/boards.ts`**

Replace the entire file (absorbs controller logic, no Koa):

```typescript
import * as boardsService from "../services/boardsService";

const ROUTES: [string, RegExp, (req: Request, m: RegExpMatchArray) => Promise<Response>][] = [
  ["GET",    /^\/api\/v1\/boards$/,       handleList],
  ["POST",   /^\/api\/v1\/boards$/,       handleCreate],
  ["GET",    /^\/api\/v1\/boards\/(.+)$/, handleGet],
  ["DELETE", /^\/api\/v1\/boards\/(.+)$/, handleDelete],
];

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  for (const [method, pattern, handler] of ROUTES) {
    if (req.method !== method) continue;
    const match = url.pathname.match(pattern);
    if (match) return handler(req, match);
  }
  return new Response("Not Found", { status: 404 });
}

async function handleList(): Promise<Response> {
  const boards = await boardsService.listBoards();
  return json(
    boards.map((b) => ({
      id: b.id,
      title: b.title,
      updatedAt: b.updatedAt.toISOString(),
      createdAt: b.createdAt.toISOString(),
    }))
  );
}

async function handleCreate(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const board = await boardsService.createBoard(body.title ?? "Untitled Board");
  return json(board, 201);
}

async function handleGet(_req: Request, m: RegExpMatchArray): Promise<Response> {
  const board = await boardsService.getBoard(m[1]);
  if (!board) return json({ error: "Board not found" }, 404);
  return json(board);
}

async function handleDelete(_req: Request, m: RegExpMatchArray): Promise<Response> {
  try {
    await boardsService.deleteBoard(m[1]);
    return new Response(null, { status: 204 });
  } catch {
    return json({ error: "Board not found" }, 404);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 2: Delete `boardsController.ts`**

```bash
rm apps/server/src/controllers/boardsController.ts
```

- [ ] **Step 3: Type-check routes/boards.ts**

```bash
cd apps/server && bunx tsc --noEmit --skipLibCheck 2>&1 | grep "routes/boards"
```

Expected: no lines output.

- [ ] **Step 4: Commit**

```bash
cd ..
git add apps/server/src/routes/boards.ts
git rm apps/server/src/controllers/boardsController.ts
git commit -m "feat(server): rewrite HTTP routes with Request/Response, remove Koa controller"
```

---

### Task 6: Rewrite server entry point

**Files:**
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: Rewrite `apps/server/src/index.ts`**

Replace the entire file:

```typescript
import { handleRequest } from "./routes/boards";
import { wsHandlers, type WsData } from "./ws/socket";

const PORT = Number(process.env.PORT ?? 3000);

const server = Bun.serve<WsData>({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade at /ws
    if (url.pathname === "/ws") {
      const clientId = crypto.randomUUID();
      const upgraded = server.upgrade(req, { data: { clientId, boardId: null } });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // REST routes
    return handleRequest(req).then(addCors);
  },
  websocket: wsHandlers,
});

console.log(`Server running on http://localhost:${server.port}`);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function addCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}
```

- [ ] **Step 2: Full server TypeScript check**

```bash
cd apps/server && bunx tsc --noEmit --skipLibCheck
```

Expected: exits 0, no errors.

- [ ] **Step 3: Start server**

```bash
cd apps/server && DATABASE_URL="postgresql://user:pass@localhost:5432/whiteboard" bun --hot src/index.ts
```

Expected:
```
Server running on http://localhost:3000
```

If `DATABASE_URL` is not available locally, confirm TypeScript passes and proceed to commit. **Task 8 Steps 1–4 are the mandatory verification gate for this step** — do not mark the migration complete without running them.

- [ ] **Step 4: Smoke-test REST (with server running)**

```bash
# Create board
curl -s -X POST http://localhost:3000/api/v1/boards \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test"}' | jq .
```

Expected response:
```json
{ "id": "c...", "title": "Smoke Test", "elements": [], "updatedAt": "..." }
```

```bash
# Retrieve board (replace <id>)
curl -s http://localhost:3000/api/v1/boards/<id> | jq .
```

Expected: same object returned.

- [ ] **Step 5: Commit**

```bash
cd ..
git add apps/server/src/index.ts
git commit -m "feat(server): rewrite entry point using Bun.serve() — unified HTTP + WebSocket"
```

---

## Chunk 3: Frontend Rewrite & Integration Verification

### Task 7: Rewrite frontend socket client + fix useCursors

**Files:**
- Modify: `apps/web/src/lib/socket.ts`
- Modify: `apps/web/src/hooks/useCursors.ts`

- [ ] **Step 1: Rewrite `apps/web/src/lib/socket.ts`**

Replace the entire file. The public API (all exported function names and signatures) is **identical** to the current implementation:

```typescript
import type { WsClientMessage, WsServerMessage } from "@whiteboard/shared/types/ws";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";
export type CursorData = { clientId: string; x: number; y: number };
type StatusHandler = (s: ConnectionStatus) => void;

let ws: WebSocket | null = null;
let currentBoardId: string | null = null;
let statusHandlers: StatusHandler[] = [];
let opHandlers: ((op: WhiteBoardOperation) => void)[] = [];
let cursorHandlers: ((d: CursorData) => void)[] = [];
let currentStatus: ConnectionStatus = "disconnected";
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

function setStatus(s: ConnectionStatus) {
  currentStatus = s;
  statusHandlers.forEach((h) => h(s));
}

function send(msg: WsClientMessage) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT) {
    setStatus("disconnected");
    return;
  }
  setStatus("reconnecting");
  const delay = Math.min(1000 * 2 ** reconnectAttempts, 5000);
  reconnectTimer = setTimeout(() => {
    reconnectAttempts++;
    if (currentBoardId) connect(currentBoardId);
  }, delay);
}

export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

export function onStatusChange(h: StatusHandler) {
  statusHandlers.push(h);
}

export function offStatusChange(h: StatusHandler) {
  statusHandlers = statusHandlers.filter((x) => x !== h);
}

export function connect(boardId: string) {
  // Guard against dangling WebSocket from previous connection attempt
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  currentBoardId = boardId;
  setStatus("connecting");
  const base = import.meta.env.VITE_WS_URL ?? "http://localhost:4000";
  const url = base.replace(/^http/, "ws") + "/ws";
  ws = new WebSocket(url);

  ws.onopen = () => {
    reconnectAttempts = 0;
    setStatus("connected");
    send({ type: "join-board", boardId });
  };

  ws.onclose = () => scheduleReconnect();

  ws.onmessage = (e) => {
    const msg: WsServerMessage = JSON.parse(e.data);
    if (msg.type === "op") opHandlers.forEach((h) => h(msg.data));
    if (msg.type === "cursor") {
      cursorHandlers.forEach((h) =>
        h({ clientId: msg.clientId, x: msg.x, y: msg.y })
      );
    }
  };
}

export function disconnect(boardId: string) {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  send({ type: "leave-board", boardId });
  ws?.close();
  ws = null;
  currentBoardId = null;
  setStatus("disconnected");
}

export function sendOperation(op: WhiteBoardOperation) {
  send({ type: "op", data: op });
}

export function onOperation(h: (op: WhiteBoardOperation) => void) {
  opHandlers.push(h);
}

export function offOperation(h: (op: WhiteBoardOperation) => void) {
  opHandlers = opHandlers.filter((x) => x !== h);
}

export function sendCursor(boardId: string, x: number, y: number) {
  send({ type: "cursor", boardId, x, y });
}

export function onCursor(h: (d: CursorData) => void) {
  cursorHandlers.push(h);
}

export function offCursor(h: (d: CursorData) => void) {
  cursorHandlers = cursorHandlers.filter((x) => x !== h);
}

// clientId is assigned server-side; server pub/sub already excludes the sender
export function getSocketId(): string | undefined {
  return undefined;
}
```

- [ ] **Step 2: Remove self-cursor filter from `apps/web/src/hooks/useCursors.ts`**

The server's `ws.publish()` already excludes the sender, so this filter is redundant.
Make two targeted edits using exact string matching:

**Edit 1 — remove `getSocketId` from imports:**

Find this exact text:
```typescript
  getSocketId,
  type CursorData,
```
Replace with:
```typescript
  type CursorData,
```

**Edit 2 — remove the three-line self-filter block:**

Find this exact text:
```typescript
      const mySocketId = getSocketId();
      // Ignore our own cursor
      if (data.clientId === mySocketId) return;

```
Replace with: *(empty string — delete these four lines entirely)*

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && bunx tsc --noEmit
```

Expected: exits 0, no errors.

- [ ] **Step 4: Commit**

```bash
cd ..
git add apps/web/src/lib/socket.ts apps/web/src/hooks/useCursors.ts
git commit -m "feat(web): replace socket.io-client with native WebSocket, remove redundant self-cursor filter"
```

---

### Task 8: Integration verification

**Files:** none (verification only — no code changes)

- [ ] **Step 1: Start the server**

```bash
cd apps/server && DATABASE_URL="postgresql://user:pass@localhost:5432/whiteboard" bun --hot src/index.ts
```

Expected:
```
Server running on http://localhost:3000
```

- [ ] **Step 2: Start the frontend (second terminal)**

```bash
bun run dev:web
```

Expected: Vite ready on `http://localhost:5173`.

- [ ] **Step 3: Create a board and verify REST**

Open `http://localhost:5173`. Create a new board via the UI.

Expected: redirected to board canvas. No errors in browser DevTools Console.

- [ ] **Step 4: Verify board persistence**

Reload the page (`F5`).

Expected: board loads correctly with an empty canvas.

- [ ] **Step 5: Test real-time drawing (two tabs)**

Open the same board URL in a second browser tab.

In Tab A: draw a rectangle or freehand stroke on the canvas.

Expected: the shape appears in Tab B **without reloading**. No errors in either tab's console.

- [ ] **Step 6: Test cursor sync (no self-cursor)**

Move the mouse over the canvas in Tab A.

Expected:
- Tab B shows a colored cursor dot tracking Tab A's position.
- Tab A does **not** show its own cursor dot (self-cursor is suppressed server-side).

- [ ] **Step 7: Test reconnection**

With both tabs open:
1. Stop the server (Ctrl+C in the server terminal).
2. Wait ~3 seconds — browser status should show `reconnecting`.
3. Restart the server.

Expected: status returns to `connected` within 5 seconds. Drawing in Tab A **after** reconnection appears in Tab B.
Note: any operations sent *during* the disconnection window are silently dropped — this is an accepted behavior difference from Socket.IO (documented in the spec).

- [ ] **Step 8: Confirm working tree is clean**

All code changes were committed in Tasks 1–7. Verify:

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

If any unstaged files remain (e.g., a local `.env`), do **not** use `git add .`. Stage only project files explicitly:

```bash
# Example if any tracked file was unintentionally modified
git diff --name-only  # inspect before staging
```

If the tree is already clean, no commit is needed — the migration is complete.
