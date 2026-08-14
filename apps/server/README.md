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

| 变量                 | 必填 | 说明                       |
| -------------------- | ---- | -------------------------- |
| `DATABASE_URL`       | 是   | PostgreSQL 连接串          |
| `BETTER_AUTH_SECRET` | 是   | Better Auth 会话签名密钥   |
| `BETTER_AUTH_URL`    | 否   | Better Auth base URL       |
| `NODE_ENV`           | 否   | 默认 `development`         |
| `PORT`               | 否   | HTTP 端口，默认 `4000`     |
| `LOG_LEVEL`          | 否   | Pino 日志级别，默认 `info` |

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
pnpm test
pnpm typecheck
```

## HTTP 文档

- OpenAPI JSON：`GET /doc`
- Scalar UI：`GET /reference`

## 目录

HTTP 层按路由组组织，领域服务继续使用工厂注入：

- `src/index.ts` - Node HTTP 与 Socket.IO 启动入口
- `src/bootstrap.ts` - 组合根，创建并连接数据库、认证、领域服务与实时服务
- `src/app.ts` - 挂载 HTTP 路由组与 OpenAPI
- `src/lib/` - Hono/OpenAPI 工厂、Better Auth、token 解析和公共类型
- `src/middlewares/` - HTTP 中间件
- `src/routes/<group>/` - `*.routes.ts` 契约、`*.handlers.ts` 处理器、`*.index.ts` 路由组装
- `src/tests/` - 所有测试与 Vitest 配置
- `src/services/` - 认证、白板、操作、在线状态与协作服务
- `src/sockets/` - Socket.IO adapter
- `src/types/` - 服务端领域类型
- `src/shared/` - Prisma、`ApiError`、进程内限流和 HTTP 错误工具

依赖方向：route/socket adapter → service → shared，服务不 import Hono/Socket.IO。

事件名：`board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay`。

HTTP 成功响应直接返回资源；错误统一 `{ error: { code, message } }`。
