# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## Stack (current)

- Runtime: Node.js + pnpm workspace.
- HTTP: Hono (on `@hono/node-server`, `serve()` return value is the Node `http.Server` Socket.IO attaches to). Realtime: Socket.IO.
- DB: PostgreSQL + Prisma 7 (`apps/server/prisma`). Client output: `apps/server/prisma/generated`.
- Auth: Better Auth (`src/modules/auth/better-auth.ts` - Prisma adapter, bearer plugin, bcrypt password verify). One sliding session token serves as access+refresh token.
- Rate limit: in-process sliding window (`shared/rate-limit.ts`). No Redis.
- Shared contracts: `packages/shared` (`@whiteboard/shared`).

Server layout (feature modules, factory DI, composition root in `index.ts`):

- `src/config.ts` - zod-validated env; `src/shared/` - prisma factory, ApiError, rate-limit, http helpers
- `src/modules/auth/` - better-auth config, service, token resolver, middleware, router (both `/api/auth/*` and `/api/v1/auth/*` mounts)
- `src/modules/boards/` - boards/operations services, board-access, board-state (pure), router
- `src/modules/realtime/` - presence, collaboration (commit/replay orchestration), socket adapter
- Dependency direction: router/socket adapters → services → shared. Domain modules never import hono/socket.io.

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

- Board HTTP and Socket.IO both require a session token via the token resolver (`modules/auth/token.ts`). Socket auth via `handshake.auth.token`.
- Logout revokes the session row (Better Auth) and disconnects sockets via the `onLogout` callback wired in `index.ts`.
- Operation path: authorize -> persist (atomic `boardId+seq`) -> ack submitter -> broadcast `operation:committed` to room.
- Event names: `board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay` (no legacy `join-board`/`op`).
- HTTP responses return the resource directly; errors use `{ error: { code, message } }` (no envelope).
- Prisma generate needs `DATABASE_URL` set even when not connecting.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
