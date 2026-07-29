# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## Stack (current)

- Runtime: Node.js + pnpm workspace. Do **not** reintroduce Bun runtime or Elysia.
- HTTP: Koa. Realtime: Socket.IO.
- DB: PostgreSQL + Prisma 7 (`apps/server/prisma`). Client output: `apps/server/prisma/generated`.
- Redis: rate limit + JWT blacklist (`apps/server/src/lib/redis.ts`, supports `memory://`).
- Shared contracts: `packages/shared` (`@whiteboard/shared`).

Server layout (flat domain modules, no controller/service/repository layers):

- `resolve-access-token.ts` - JWT → user (HTTP + Socket)
- `board-access.ts` / `board-state.ts` / `boards.ts` / `operations.ts` / `auth.ts`
- `collaboration.ts` - presence + join/commit/replay orchestration
- `routes/` + `sockets/socket.ts` - thin transport adapters

## Commands

```bash
pnpm install
DATABASE_URL=postgresql://... pnpm prisma:generate
pnpm --filter @whiteboard/server typecheck
pnpm build:web
pnpm dev:server   # default PORT=4000
pnpm dev:web      # Vite 5173; API/WS -> localhost:4000
```

Server env template: `apps/server/.env.example` (real dotenv values, not Make syntax).

## Sharp edges

- Board HTTP and Socket.IO both require JWT via `resolveAccessToken`. Socket auth via `handshake.auth.token`.
- Operation path: authorize -> persist (atomic `boardId+seq`) -> ack submitter -> broadcast `operation:committed` to room.
- Event names: `board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay` (no legacy `join-board`/`op`).
- HTTP responses use `{ success, data }` envelope (including boards).
- Prisma generate needs `DATABASE_URL` set even when not connecting.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
