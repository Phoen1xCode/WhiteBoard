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

后端按运行入口、HTTP、业务和实时协作四个边界组织：

- `src/index.ts` - 启动 Node HTTP，挂载 Socket.IO
- `src/app.ts` - 注册 Hono 全局中间件、OpenAPI 和功能路由
- `src/config.ts` / `src/db.ts` - 环境配置与 Prisma 单例
- `src/lib/` - Better Auth、HTTP 错误、Hono 基础类型和进程内限流
- `src/middleware/` - 认证与日志中间件
- `src/routes/` - 每个功能一个文件，OpenAPI 契约和 handler 放在一起
- `src/services/` - 与 Hono、Socket.IO 无关的认证、白板和操作业务
- `src/socket/` - Socket.IO 事件、在线状态与协作编排
- `src/tests/` - Vitest 配置和 HTTP 路由测试

依赖方向：`route/socket -> service -> db`。模块直接导入单例，不使用手写 IoC 容器。

事件名：`board:join` / `board:leave` / `cursor:update` / `operation:commit` / `operation:replay`。

HTTP 成功响应直接返回资源；错误统一 `{ error: { code, message } }`。
