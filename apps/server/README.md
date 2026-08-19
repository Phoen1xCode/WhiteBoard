# @whiteboard/server

基于 Hono、Socket.IO、Prisma 和 Better Auth 的 WhiteBoard 后端。默认监听 `http://localhost:4000`。

## 技术栈

- Node.js >= 20.19
- Hono + Zod 请求校验
- Socket.IO
- PostgreSQL + Prisma 7
- Better Auth + bearer / username / jwt plugins
- Pino
- Zod

## 快速开始

所有命令默认在仓库根目录执行。

1. 安装依赖：

```bash
pnpm install
```

2. 创建环境变量文件：

```bash
cp apps/server/.env.example apps/server/.env
```

3. 生成 Prisma Client 并执行迁移：

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

4. 启动后端：

```bash
pnpm dev:server
```

5. 验证服务：

```bash
curl http://localhost:4000/
# {"message":"WhiteBoard API"}
```

## 环境变量

| 变量                 | 必填 | 默认值        | 说明                              |
| -------------------- | ---- | ------------- | --------------------------------- |
| `DATABASE_URL`       | 是   | 无            | PostgreSQL 连接串                 |
| `BETTER_AUTH_SECRET` | 是   | 无            | Better Auth 会话密钥，建议 32+ 位 |
| `BETTER_AUTH_URL`    | 否   | 自动推断      | Better Auth base URL              |
| `NODE_ENV`           | 否   | `development` | 运行环境                          |
| `PORT`               | 否   | `4000`        | HTTP 和 Socket.IO 端口            |
| `LOG_LEVEL`          | 否   | `info`        | Pino 日志级别                     |

环境变量由 `src/config.ts` 在启动时通过 Zod 校验。缺少必填值时服务会立即退出。`BETTER_AUTH_SECRET` 至少需要 32 个字符，可用 `openssl rand -base64 32` 生成。

## 常用命令

| 仓库根目录命令                               | 作用                   |
| -------------------------------------------- | ---------------------- |
| `pnpm dev:server`                            | watch 模式启动后端     |
| `pnpm --filter @whiteboard/server start`     | 启动后端，不启用 watch |
| `pnpm --filter @whiteboard/server test`      | 运行后端测试           |
| `pnpm --filter @whiteboard/server typecheck` | 后端 TypeScript 检查   |
| `pnpm prisma:generate`                       | 生成 Prisma Client     |
| `pnpm prisma:migrate`                        | 创建并执行开发迁移     |

Prisma Client 生成到 `prisma/generated`，源码通过 `@generated/*` 引用。

## HTTP API

### 服务入口

- `GET /` - 服务入口，不检查数据库连接

### 认证

| 方法 | 路径                    | 认证 | 说明                          |
| ---- | ----------------------- | ---- | ----------------------------- |
| POST | `/api/v1/auth/register` | 否   | 注册并创建会话                |
| POST | `/api/v1/auth/login`    | 否   | 登录并创建会话                |
| POST | `/api/v1/auth/refresh`  | 否   | 校验当前滑动会话              |
| POST | `/api/v1/auth/logout`   | 是   | 撤销会话并断开该用户的 Socket |
| GET  | `/api/v1/auth/me`       | 是   | 获取当前用户                  |

登录 / 注册 / 刷新同时返回两套 token：`accessToken` 是 15 分钟 JWT，`refreshToken` 是 Better Auth session token。受保护请求和 Socket 使用 JWT；refresh / logout 使用 session token 吊销会话。

受保护请求使用：

```http
Authorization: Bearer <jwt-access-token>
```

`POST /api/v1/auth/logout` 需要 JSON body；没有额外参数时发送 `{}`。`/api/auth/*` 由 Better Auth 原生 handler 处理，不属于项目的 `/api/v1` 契约。

### 白板

| 方法   | 路径                 | 最低权限     | 说明                     |
| ------ | -------------------- | ------------ | ------------------------ |
| GET    | `/api/v1/boards`     | 已登录       | 列出当前用户可访问的白板 |
| POST   | `/api/v1/boards`     | 已登录       | 创建白板，创建者为 owner |
| GET    | `/api/v1/boards/:id` | viewer       | 获取快照和 `lastSeq`     |
| PATCH  | `/api/v1/boards/:id` | owner/editor | 修改标题                 |
| DELETE | `/api/v1/boards/:id` | owner        | 删除白板，成功返回 `204` |

### 响应与错误

成功响应直接返回资源，不使用额外 envelope。错误统一为：

```json
{
  "error": {
    "code": "BOARD_NOT_FOUND",
    "message": "Board not found"
  }
}
```

业务错误使用 `src/lib/errors.ts` 中的 `HttpError`。500 级错误不会向客户端暴露内部消息。

## Socket.IO

### 连接认证

首选通过 Socket.IO handshake 传入会话 token：

```ts
io("http://localhost:4000", {
  auth: { token: sessionToken },
});
```

服务端也接受 handshake 的 `Authorization: Bearer <session-token>` header。认证失败时连接会以 `UNAUTHORIZED` 拒绝。

### 客户端事件

| 事件               | Payload                               | 说明                            |
| ------------------ | ------------------------------------- | ------------------------------- |
| `board:join`       | `{ boardId }`                         | 校验查看权限并加入白板房间      |
| `board:leave`      | `{ boardId }`                         | 离开白板房间                    |
| `operation:commit` | `{ boardId, operation, clientOpId? }` | 提交操作，支持 ack 和幂等键     |
| `operation:replay` | `{ boardId, fromSeq }`                | 获取所有 `seq > fromSeq` 的操作 |
| `cursor:update`    | `{ boardId, x, y }`                   | 广播光标，仅已加入成员有效      |

### 服务端事件

| 事件                                    | 说明                        |
| --------------------------------------- | --------------------------- |
| `board:joined`                          | 加入成功，包含当前成员列表  |
| `board:user-joined` / `board:user-left` | 白板成员变化                |
| `operation:committed`                   | 向提交者之外的房间成员广播  |
| `operation:replayed`                    | replay 结果                 |
| `cursor:updated`                        | 其他成员的光标位置          |
| `error`                                 | 无法通过 ack 返回的事件错误 |

支持 ack 的事件返回以下联合结构：

```ts
type AckResult<T> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error: { code: string; message: string; retryAfterMs?: number };
    };
```

### operation:commit 数据流

1. 确认 socket 已加入白板，并校验 payload 和 owner/editor 权限。
2. 使用 `FOR UPDATE` 锁定白板行。
3. 使用 `boardId + clientOpId` 处理重复提交。
4. 计算下一个 `seq`。
5. 在同一事务写入 operation 并更新 `Board.snapshot`。
6. ack 提交者；只有新 operation 才广播给其他成员。

`GET /api/v1/boards/{id}` 使用共享行锁读取 snapshot，并在同一事务读取最新 `seq`，避免返回不一致的初始状态。

## 数据库

Schema 位于 `prisma/schema.prisma`，迁移位于 `prisma/migrations`。

- `Permission` 的 `(boardId, userId)` 唯一约束保证每个用户在同一白板只有一个角色。
- `Operation` 的 `(boardId, seq)` 唯一约束保证操作顺序。
- `Operation` 的 `(boardId, clientOpId)` 唯一约束保证客户端重试幂等。
- 白板创建时同时写入 `Board.ownerId` 和 owner `Permission`；权限判断以 `Permission` 为准。
- 当前实时状态写入 `Board.snapshot`。`Snapshot` 表已存在，但尚未用于 snapshot compaction。

## 限流与单实例状态

| 路径或事件         | 限制                     |
| ------------------ | ------------------------ |
| 注册               | 每 IP 每分钟 5 次        |
| 登录               | 每 IP 每分钟 10 次       |
| 创建白板           | 每用户每分钟 20 次       |
| `operation:commit` | 每用户、每白板每秒 60 次 |
| `cursor:update`    | 每用户、每白板每秒 30 次 |

限流窗口和 presence 都保存在当前 Node.js 进程内。当前实现适用于单实例部署；多实例部署前需要把这些状态迁移到共享存储，并为 Socket.IO 配置跨实例 adapter。

## 代码结构

```text
src/
├── index.ts                 # Node HTTP 与 Socket.IO 启动
├── app.ts                   # Hono 中间件与路由装配
├── config.ts                # 环境变量校验和配置单例
├── db.ts                    # Prisma 单例
├── lib/
│   ├── auth.ts              # Better Auth 与 token 解析
│   ├── errors.ts            # HttpError 和全局错误响应
│   ├── hono.ts              # Hono 类型与 router 工厂
│   └── rate-limit.ts        # 进程内滑动窗口限流
├── middleware/
│   ├── auth.ts                      # Bearer 认证
│   ├── better-auth-rate-limit.ts    # Better Auth 登录/注册限流
│   └── logger.ts                    # Pino 请求日志
├── routes/
│   ├── auth.ts              # Auth 路由、校验与 handler
│   ├── boards.ts            # Board 路由、校验与 handler
│   └── index.ts             # GET /
├── services/
│   ├── auth.ts              # 注册、登录、会话业务
│   ├── board-state.ts       # 快照解析与 operation 应用
│   ├── boards.ts            # 白板 CRUD 和权限检查
│   └── operations.ts        # operation 持久化与 replay
├── socket/
│   ├── index.ts             # Socket.IO 认证和事件 adapter
│   ├── collaboration.ts     # commit/replay 编排
│   └── presence.ts          # 单实例在线成员状态
└── tests/                   # Vitest HTTP 测试
```

依赖方向：

```text
HTTP route  -> service -> db
Socket event -> service -> db
```

- 路由按功能组织，请求校验和 handler 保存在同一个文件。
- 服务不导入 Hono 或 Socket.IO。
- Prisma、Better Auth 和服务通过 TypeScript 模块单例直接复用。
- `src/index.ts` 只处理进程启动及 HTTP/Socket 生命周期接线。

## 测试

```bash
pnpm --filter @whiteboard/server test
pnpm --filter @whiteboard/server typecheck
```

当前测试覆盖 HTTP 路由、请求校验、认证中间件、统一错误格式和主要 handler 接线。测试使用服务 mock，不连接真实 PostgreSQL；数据库事务和 Socket.IO 协作流需要单独的集成测试环境。
