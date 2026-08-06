# @whiteboard/server

Hono + Socket.IO 后端。默认监听 `http://localhost:4000`。

## 前置条件

- Node.js >= 20.19
- pnpm >= 11
- PostgreSQL

在**仓库根目录**安装依赖：

```bash
pnpm install
```

## 环境变量

```bash
cp .env.example .env
```

| 变量                 | 必填 | 说明                     |
| -------------------- | ---- | ------------------------ |
| `DATABASE_URL`       | 是   | PostgreSQL 连接串        |
| `BETTER_AUTH_SECRET` | 是   | Better Auth 会话签名密钥 |
| `BETTER_AUTH_URL`    | 否   | Better Auth base URL     |
| `PORT`               | 否   | HTTP 端口，默认 `4000`   |

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

按领域概念划分模块，工厂函数注入依赖，`src/index.ts` 为组合根：

- `src/config.ts` - zod 校验的环境变量
- `src/shared/` - prisma 工厂、`ApiError`、限流（进程内）、HTTP 错误处理与校验
- `src/modules/auth/` - Better Auth 配置、auth service、token 解析、中间件、路由（`/api/auth/*` 与 `/api/v1/auth/*` 两处挂载都在此）
- `src/modules/boards/` - boards / operations service、权限检查、board-state 纯函数、路由
- `src/modules/realtime/` - presence、collaboration（commit/replay 编排）、Socket.IO adapter

依赖方向：router/socket adapter → service → shared，domain 模块不 import hono/socket.io。

事件名：`board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay`。

HTTP 成功响应直接返回资源；错误统一 `{ error: { code, message } }`。
