# @whiteboard/server

Koa + Socket.IO 后端。默认监听 `http://localhost:4000`。

## 前置条件

- Node.js >= 20.19
- pnpm >= 11
- PostgreSQL
- Redis（本地可用 `memory://`）

在**仓库根目录**安装依赖：

```bash
pnpm install
```

## 环境变量

```bash
cp .env.example .env
```

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `PORT` | 否 | HTTP 端口，默认 `4000` |
| `REDIS_URL` | 是 | Redis 地址；可用 `memory://` |
| `JWT_ACCESS_SECRET` | 是 | access token 签名密钥 |
| `JWT_REFRESH_SECRET` | 是 | refresh token 签名密钥 |
| `JWT_ACCESS_EXPIRES_IN` | 否 | 默认 `15m` |
| `JWT_REFRESH_EXPIRES_IN` | 否 | 默认 `7d` |

## 初始化数据库

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

## 运行

```bash
pnpm dev:server   # 仓库根目录
pnpm dev          # 本包
pnpm start        # 无 watch
pnpm typecheck
```

## 目录

扁平 domain modules，无 controller/service/repository 分层：

- `src/resolve-access-token.ts` - JWT → user（HTTP + Socket）
- `src/auth.ts` / `src/boards.ts` / `src/operations.ts`
- `src/board-access.ts` / `src/board-state.ts`
- `src/collaboration.ts` - presence + join/commit/replay
- `src/routes/` / `src/sockets/socket.ts` - transport adapters
- `src/lib/` / `src/middleware/` - 基础设施

事件名：`board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay`。

HTTP 响应统一 `{ success, data }` envelope。
