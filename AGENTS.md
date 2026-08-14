# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## Stack (current)

- Runtime: Node.js + pnpm workspace.
- HTTP: Hono + `@hono/zod-openapi`; `/doc` and `/reference` expose OpenAPI/Scalar. Pino handles request logs. Realtime: Socket.IO attaches to the Node `http.Server` returned by `serve()`.
- DB: PostgreSQL + Prisma 7 (`apps/server/prisma`). Client output: `apps/server/prisma/generated`.
- Auth: Better Auth (`src/lib/better-auth.ts` - Prisma adapter, bearer plugin, bcrypt password verify). One sliding session token serves as access+refresh token.
- Rate limit: in-process sliding window (`src/shared/rate-limit.ts`). No Redis.
- Shared contracts: `packages/shared` (`@whiteboard/shared`).

Server layout (OpenAPI route groups, factory DI, composition root in `bootstrap.ts`):

- `src/index.ts` starts Node HTTP + Socket.IO; `src/app.ts` mounts route groups; `src/config.ts` validates env
- `src/lib/` owns Hono/OpenAPI, Better Auth, and token setup; `src/middlewares/` owns HTTP middleware
- `src/routes/<group>/` separates route contracts, handlers, and assembly; all tests/config live in `src/tests/`
- `src/services/` contains auth, boards/operations, access/state, presence, and collaboration services
- `src/sockets/` contains the Socket.IO adapter; `src/types/` contains server-only domain types
- Dependency direction: route/socket adapters → services → shared. Services never import hono/socket.io.

## Commands

```bash
pnpm install
DATABASE_URL=postgresql://... pnpm prisma:generate
pnpm --filter @whiteboard/server test
pnpm --filter @whiteboard/server typecheck
pnpm build:web
pnpm dev:server   # default PORT=4000
pnpm dev:web      # Vite 5173; API/WS -> localhost:4000
```

- Server env template: `apps/server/.env.example`. Needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

## Sharp edges

- Board HTTP and Socket.IO both require a session token via the token resolver (`lib/token.ts`). Socket auth via `handshake.auth.token`.
- Logout revokes the session row (Better Auth) and disconnects sockets via the `onLogout` callback wired in `bootstrap.ts`.
- Operation path: authorize -> persist (atomic `boardId+seq`) -> ack submitter -> broadcast `operation:committed` to room.
- Event names: `board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay` (no legacy `join-board`/`op`).
- HTTP responses return the resource directly; errors use `{ error: { code, message } }` (no envelope).
- Prisma generate needs `DATABASE_URL` set even when not connecting.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
