# CLAUDE.md

This file provides guidance to AI coding assistants when working with code in this repository. Adherence to these guidelines is crucial for maintaining code quality and consistency.

## Guiding Principles (MUST FOLLOW)

- Keep it clear: Write code that is easy to read, maintain, and explain.
- Match the house style: Reuse existing patterns, naming, and conventions.
- Search smart: Prefer ast-grep for semantic queries; fall back to rg/grep when needed.

## Project Overview

WhiteBoard is a real-time collaborative whiteboard application (inspired by Excalidraw) built as a monorepo using yarn workspaces. It enables teams to draw and collaborate on a shared canvas in real-time.

## Workspace Structure

- `apps/web` - Frontend React application (@whiteboard/web)
- `apps/server` - Backend Node.js server (@whiteboard/server)
- `packages/shared` - Shared types and schemas (@whiteboard/shared)

## Development Commands

### Initial Setup

```bash
yarn install
```

### Frontend (apps/web)

```bash
# Development server (runs on Vite's default port, usually 5173)
cd apps/web && yarn dev

# Production build
cd apps/web && yarn build

# Lint
cd apps/web && yarn lint

# Preview production build
cd apps/web && yarn preview
```

### Backend (apps/server)

```bash
# Development server with auto-reload (default port: 3000)
cd apps/server && yarn dev

# Production server
cd apps/server && yarn start

# Lint
cd apps/server && yarn lint

# Generate Prisma client
cd apps/server && yarn prisma:generate

# Run database migrations
cd apps/server && yarn prisma:migrate
```

### Shared Package (packages/shared)

```bash
# Type check
cd packages/shared && yarn type-check

# Lint
cd packages/shared && yarn lint
```

### Convenience Commands

```bash
# Run web dev server from root
yarn dev:web
```

## Architecture

### Real-time Collaboration Model

The app uses an **operation-based synchronization** approach for real-time collaboration:

1. **Initial Sync**: When a client connects to a board, it fetches a snapshot from the database via REST API (`GET /boards/:id`)
2. **Operation Streaming**: All subsequent changes are synchronized via Socket.IO using `WhiteBoardOperation` messages
3. **Optimistic Updates**: Local operations are applied immediately to the UI, then broadcast to other clients via WebSocket

### Operation Types

All whiteboard modifications flow through the `WhiteBoardOperation` type defined in `packages/shared/src/types/whiteboard.ts`:

- `add` - Add a new element to the board
- `update` - Modify an existing element
- `delete` - Remove an element
- `clear` - Clear all elements from the board

Operations include a `boardId` to support multi-board isolation via Socket.IO rooms.

### Frontend State Management

State is managed using **Zustand + Immer** (see `apps/web/src/store/whiteboardStore.ts`):

- `elements`: Record<string, WhiteBoardElement> - All canvas elements indexed by ID
- `setInitialElements()` - Initialize state from server snapshot
- `applyOperation()` - Apply an operation with optional `local` flag:
  - `local: true` - Operation originated locally, already applied to UI, broadcast to others
  - `local: false` - Operation received from another client, apply to local state

### WebSocket Flow

1. **Client connects** → joins board room via `join-board` event (`apps/server/src/ws/socket.ts:8`)
2. **Local edit** → `applyOperation(op, {local: false})` → `sendOperation()` broadcasts to server
3. **Server** → forwards operation to other clients in the same board room (`socket.to(boardId).emit("op", op)`)
4. **Other clients** → receive operation → `applyOperation(op, {local: true})` updates UI

Note: The server currently does not persist operations to the database - it only relays them in real-time. Snapshots are saved via REST API.

### Database Schema

Prisma schema is located at `/prisma/schema.prisma`:

- **Board** model with:
  - `id` (cuid)
  - `title`
  - `snapshot` (JSON) - stores `{ elements: [...] }`
  - `createdAt`, `updatedAt` timestamps

PostgreSQL is used for persistence. After schema changes, run `yarn prisma:generate` and `yarn prisma:migrate` in `apps/server`.

### Canvas Rendering

- Uses **Konva.js** with **react-konva** for canvas manipulation
- Elements are rendered in `apps/web/src/components/whiteboard/Canvas.tsx`
- Supported shape types: `freehand`, `rectangle`, `circle`, `line` (see `ShapeType` in `packages/shared/src/types/whiteboard.ts`)

### REST API Endpoints

The server exposes the following HTTP endpoints (see `apps/server/src/routes/boards.ts`):

- `POST /api/v1/boards` - Create a new board

  - Body: `{ title?: string }` (defaults to "Untitled Board")
  - Returns: Board object with `id`, `title`, `snapshot`, `createdAt`, `updatedAt`

- `GET /api/v1/boards/:id` - Get board snapshot
  - Returns: Board object with all elements in the `snapshot.elements` array
  - Used by `useBoardSync` hook for initial state loading

### WebSocket Events

Socket.IO events (see `apps/server/src/ws/socket.ts`):

- **Client → Server**:

  - `join-board` - Join a board room (payload: `{ boardId: string }`)
  - `leave-board` - Leave a board room (payload: `{ boardId: string }`)
  - `op` - Send operation to other clients (payload: `WhiteBoardOperation`)
  - `cursor` - Share cursor position (payload: `{ boardId: string, x: number, y: number }`)

- **Server → Client**:
  - `op` - Receive operation from another client
  - `cursor` - Receive cursor position from another client (includes `clientId`)

## Key Files

- `packages/shared/src/types/whiteboard.ts` - Core type definitions shared between frontend/backend
- `apps/web/src/store/whiteboardStore.ts` - Zustand store with operation application logic
- `apps/web/src/hooks/useBoardSync.ts` - Hook that orchestrates snapshot loading + WebSocket sync
- `apps/web/src/lib/socket.ts` - WebSocket client wrapper with connection management
- `apps/web/src/lib/api.ts` - REST API client for board CRUD operations
- `apps/server/src/ws/socket.ts` - WebSocket event handlers for collaborative features
- `apps/server/src/routes/boards.ts` - REST API route definitions
- `apps/server/src/index.ts` - Server entry point with Koa + Socket.IO setup

## Environment Variables

### Frontend (apps/web)

- `VITE_API_BASE` - REST API base URL (defaults to `http://localhost:4000` in `apps/web/src/lib/api.ts:3`)
- `VITE_WS_URL` - WebSocket server URL (defaults to `http://localhost:4000` in `apps/web/src/lib/socket.ts:7`)

### Backend (apps/server)

- `PORT` - Server port (defaults to 3000 in `apps/server/src/index.ts:27`)
- `DATABASE_URL` - PostgreSQL connection string (required by Prisma)

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, Konva.js, Zustand, Immer, Zod, Tailwind CSS 4, Radix UI, Lucide Icons

**Backend**: Node.js, Koa, Socket.IO, Prisma, PostgreSQL

**Tooling**: ESLint, Prettier
