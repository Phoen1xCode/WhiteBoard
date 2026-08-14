# AGENTS.md

This project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## Stack (current)

- Runtime: Node.js + pnpm workspace.
- HTTP: Hono + `@hono/zod-openapi`; `/doc` and `/reference` expose OpenAPI/Scalar. Pino handles request logs. Realtime: Socket.IO attaches to the Node `http.Server` returned by `serve()`.
- DB: PostgreSQL + Prisma 7. Prisma client output: `apps/server/prisma/generated`.
- Auth: Better Auth (Prisma adapter, bearer plugin, bcrypt password verify). One sliding session token serves as access+refresh token.
- Rate limit: in-process sliding window. No Redis.
- Shared contracts: `packages/shared` (`@whiteboard/shared`).

Server layout:

- `src/index.ts` starts Node HTTP + Socket.IO; `src/app.ts` mounts Hono routes and OpenAPI
- `src/config.ts` validates env; `src/db.ts` exports the Prisma singleton
- `src/lib/` owns Better Auth, HTTP errors, Hono types, and rate limiting; `src/middleware/` owns HTTP middleware
- `src/routes/` keeps each feature's OpenAPI contract and inline handlers in one file; tests/config live in `src/tests/`
- `src/services/` contains transport-independent auth, board, and operation logic
- `src/socket/` contains Socket.IO events, presence, and collaboration orchestration
- Dependency direction: route/socket adapters -> services -> db. Services never import Hono or Socket.IO.

## Maintaining this file

- Keep this file for knowledge useful to almost every future agent session in this project.
- Do not repeat what the codebase already shows; point to the authoritative file or command instead.
- Prefer rewriting or pruning existing entries over appending new ones.
- When updating this file, preserve this bar for all agents and keep entries concise.
