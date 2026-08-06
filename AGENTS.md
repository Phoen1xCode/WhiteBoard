# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## Stack (current)

- Runtime: Node.js + pnpm workspace.
- HTTP: Hono (on `@hono/node-server`, `serve()` return value is the Node `http.Server` Socket.IO attaches to). Realtime: Socket.IO.
- DB: PostgreSQL + Prisma 7 (`apps/server/prisma`). Client output: `apps/server/prisma/generated`.
- Auth: Better Auth (`src/lib/auth.ts` - Prisma adapter, bearer plugin, bcrypt password verify). One sliding session token serves as access+refresh token.
- Rate limit: in-process sliding window (`middleware/rate-limit.ts`). No Redis.
- Shared contracts: `packages/shared` (`@whiteboard/shared`).

Server layout (flat domain modules, no controller/service/repository layers):

- `resolve-access-token.ts` - session token → user (HTTP + Socket)
- `lib/auth.ts` - betterAuth config; `auth.ts` - `/api/v1/auth/*` facade over `auth.api` (handler also mounted at `/api/auth/*`)
- `board-access.ts` / `board-state.ts` / `boards.ts` / `operations.ts`
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

- Server env template: `apps/server/.env.example`. Needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

## Sharp edges

- Board HTTP and Socket.IO both require a session token via `resolveAccessToken`. Socket auth via `handshake.auth.token`.
- Logout revokes the session row (Better Auth) and disconnects sockets.
- Operation path: authorize -> persist (atomic `boardId+seq`) -> ack submitter -> broadcast `operation:committed` to room.
- Event names: `board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay` (no legacy `join-board`/`op`).
- HTTP responses use `{ success, data }` envelope (including boards).
- Prisma generate needs `DATABASE_URL` set even when not connecting.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
