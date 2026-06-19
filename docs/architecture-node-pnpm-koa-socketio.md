# WhiteBoard 技术架构文档：Node.js + pnpm + Koa + Socket.IO

> 本文描述 WhiteBoard 重构后的目标技术栈与架构方案。
>
> 目标方案：**Node.js 作为运行时，pnpm workspace 管理 Monorepo，Koa 提供 HTTP API，Socket.IO 提供实时协作能力，并保留当前后端新增的认证、限流、仓库层、操作回放、批量写入与快照压缩等领域能力。**

## 1. 产品定位

WhiteBoard 是一个面向团队协作的在线白板产品，核心目标是提供类似 Excalidraw 的轻量绘图体验，并支持多人实时协作。

产品关注点：

- 低门槛创建和分享白板。
- 多人实时查看、编辑和协作。
- 支持基础图形、自由绘制、橡皮擦、选择、移动、变换和样式调整。
- 通过操作日志和快照保证白板状态可恢复、可回放、可持久化。
- 通过认证、权限、限流和服务分层为后续产品化打基础。

## 2. 核心技术决策

### 2.1 运行时与包管理

- 运行时：Node.js。
- 包管理器：pnpm。
- Monorepo：pnpm workspace。
- 开发执行：tsx 或 ts-node-dev。
- 构建输出：TypeScript 编译为 ESM JavaScript。

选择原因：

- Node.js 与 Koa、Socket.IO、Prisma、Redis 生态兼容性最好。
- pnpm workspace 适合前后端和共享包统一管理，依赖安装快且磁盘占用低。
- 避免 Bun 运行时、Bun lockfile 与 Node 生态之间的兼容性不确定性。
- Koa + Socket.IO 是成熟稳定的 Node 实时协作组合，团队维护成本低。

### 2.2 后端框架

- HTTP 框架：Koa。
- 路由：@koa/router。
- 实时通信：Socket.IO。
- 校验：Zod，优先与前端共享 schema。
- 鉴权：JWT，使用 jose。
- 缓存与限流：Redis，使用 ioredis。
- 数据库：PostgreSQL。
- ORM：Prisma。

选择原因：

- Koa 中间件模型简单，适合把认证、限流、错误处理、请求上下文拆成独立 middleware。
- Socket.IO 内置房间、重连、心跳、ack、多实例 adapter，适合协作白板。
- Zod 可以同时服务前端表单校验、共享协议校验和后端入参校验。
- Redis 可同时承担限流、JWT 黑名单、多实例 Socket.IO adapter 等职责。

### 2.3 前端技术栈

- 框架：React + TypeScript + Vite。
- 绘图：Konva.js + react-konva。
- 状态管理：Zustand + Immer。
- 实时连接：socket.io-client。
- 样式：Tailwind CSS。
- UI 组件：shadcn/ui 风格组件 + Lucide Icon。
- 快捷键：react-hotkeys-hook。

### 2.4 共享包

Monorepo 保留 `packages/shared`，用于承载前后端共享的领域类型、协议类型和校验 schema。

建议共享内容：

- 白板元素类型。
- 操作类型 Operation DTO。
- Socket.IO 事件 payload 类型。
- HTTP API 请求/响应 DTO。
- Zod schema。
- 权限角色类型。

## 3. 目标 Monorepo 结构

```txt
WhiteBoard/
├── apps/
│   ├── web/                         # React 前端应用
│   └── server/                      # Node.js + Koa + Socket.IO 服务端
├── packages/
│   └── shared/                      # 前后端共享类型与 schema
├── docker/                          # Docker 和部署配置
├── docs/                            # 项目文档
├── package.json                     # 根 workspace 脚本
├── pnpm-workspace.yaml              # pnpm workspace 声明
├── pnpm-lock.yaml                   # pnpm lockfile
└── tsconfig.base.json               # 共享 TypeScript 配置
```

建议服务端结构：

```txt
apps/server/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/                      # 环境变量读取和校验
│   ├── controllers/                 # Koa HTTP controller
│   ├── routes/                      # Koa Router 注册
│   ├── sockets/                     # Socket.IO 事件处理
│   ├── middleware/                  # Koa middleware
│   ├── services/                    # 业务服务
│   ├── repositories/                # Prisma 数据访问层
│   ├── lib/                         # jwt / redis / prisma / response 等基础库
│   ├── types/                       # 服务端内部类型
│   └── index.ts                     # 服务启动入口
└── package.json
```

## 4. 总体架构

```txt
Browser
  │
  ├── HTTP REST API
  │     │
  │     ▼
  │   Koa Router
  │     │
  │     ├── error middleware
  │     ├── cors middleware
  │     ├── rate-limit middleware
  │     ├── auth middleware
  │     └── controller
  │             │
  │             ▼
  │          services
  │             │
  │             ▼
  │        repositories
  │             │
  │             ▼
  │       PostgreSQL / Prisma
  │
  └── Socket.IO
        │
        ├── connection auth
        ├── board room join/leave
        ├── cursor broadcast
        ├── operation commit
        ├── operation ack
        └── operation replay
              │
              ▼
          services
              │
              ├── Redis
              └── PostgreSQL / Prisma
```

核心原则：

- Koa 只负责 HTTP 请求生命周期。
- Socket.IO 只负责实时连接、房间广播、ack 和在线状态。
- 领域逻辑集中在 service 层，HTTP 和 Socket.IO 都复用同一套 service。
- repository 层只负责数据读写，不包含业务规则。
- Redis 用于限流、JWT 黑名单、可选 Socket.IO adapter 和临时在线状态。
- PostgreSQL 存储用户、白板、权限、操作日志和快照。

## 5. 后端分层设计

### 5.1 入口层

服务端入口负责：

- 加载配置。
- 初始化 Prisma。
- 初始化 Redis。
- 创建 Koa app。
- 创建 HTTP server。
- 将 Socket.IO 挂载到同一个 HTTP server。
- 注册 HTTP 路由。
- 注册 Socket.IO 事件。
- 启动 BatchWriter。
- 启动快照压缩任务。
- 处理 SIGINT / SIGTERM 优雅关闭。

目标形态：

```ts
const app = createKoaApp(dependencies)
const server = http.createServer(app.callback())
const io = createSocketServer(server, dependencies)

await startBackgroundWorkers(dependencies)
server.listen(config.port)
```

### 5.2 Middleware 层

建议保留这些 Koa middleware：

- `errorMiddleware`：统一捕获异常，返回标准 JSON 错误。
- `corsMiddleware`：允许前端域名和 Authorization header。
- `rateLimitMiddleware`：基于 Redis sliding window 限流。
- `authMiddleware`：解析 Bearer token，校验 JWT 和 JTI 黑名单。
- `validateBody(schema)`：用 Zod 校验 request body。
- `validateQuery(schema)`：用 Zod 校验 query string。

### 5.3 Controller / Route 层

Controller 只做四件事：

- 读取请求参数。
- 调用 Zod schema 校验。
- 调用 service。
- 设置 HTTP status 和 response body。

Controller 不直接访问 Prisma、Redis 或 Socket.IO。

### 5.4 Service 层

Service 是主要业务层，保留当前新增能力：

- `AuthService`
  - 注册。
  - 登录。
  - 刷新 token。
  - 登出。
  - JWT JTI 黑名单。

- `BoardService`
  - 创建白板。
  - 获取白板详情。
  - 获取用户白板列表。
  - 删除白板。
  - 校验用户是否有权限访问或编辑白板。

- `OperationService`
  - 提交操作。
  - 分配 board 内递增 seq。
  - 根据 snapshot + operation log 回放白板状态。
  - 支持从指定 seq 之后 replay。
  - 保证操作写入和广播的顺序一致性。

- `BatchWriter`
  - 将高频操作批量落库。
  - 降低实时协作场景下数据库写入压力。
  - 在服务关闭时 flush 未写入操作。

- `CompactionService`
  - 周期性生成白板快照。
  - 将旧 operation log 压缩进 snapshot。
  - 控制 operation 表长期增长。

### 5.5 Repository 层

Repository 封装 Prisma 访问，建议保留：

- `UserRepository`
- `BoardRepository`
- `OperationRepository`
- `SnapshotRepository`
- `PermissionRepository`，如果权限逻辑继续增长，建议从 BoardRepository 中拆出。

Repository 约束：

- 不处理 HTTP status。
- 不处理 Socket.IO event。
- 不校验 JWT。
- 不做复杂业务编排。
- 只表达数据读写意图。

## 6. 数据模型

当前核心模型保留：

- `User`
  - 用户身份。
  - 包含 email、username、password、createdAt、updatedAt。

- `Board`
  - 白板实体。
  - 归属于 owner。
  - 关联 operations、snapshots、permissions。

- `Operation`
  - 白板操作日志。
  - 通过 `boardId + seq` 保证单个白板内操作顺序。
  - `opType` 表达操作类型。
  - `payload` 存储操作内容。

- `Snapshot`
  - 白板状态快照。
  - 记录某个 seq 时刻的完整白板状态。
  - 用于加速白板加载和减少 replay 成本。

- `Permission`
  - 白板权限关系。
  - role 建议限定为 `owner | editor | viewer`。

JWT 黑名单建议继续存 Redis，不建议单独落 PostgreSQL，除非需要审计登出记录。

## 7. HTTP API 方案

### 7.1 健康检查

```txt
GET /health
```

返回服务状态、版本和必要依赖状态。

### 7.2 认证接口

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

建议 token 策略：

- access token：短有效期，例如 15 分钟。
- refresh token：长有效期，例如 7 天或 30 天。
- token 中包含 `sub`、`jti`、`type`、`exp`。
- logout 时将 access token 或 refresh token 的 JTI 写入 Redis 黑名单。

### 7.3 白板接口

```txt
GET    /boards
POST   /boards
GET    /boards/:boardId
PATCH  /boards/:boardId
DELETE /boards/:boardId
GET    /boards/:boardId/replay
```

建议职责：

- `GET /boards`：获取当前用户可访问白板列表。
- `POST /boards`：创建白板并创建 owner permission。
- `GET /boards/:boardId`：获取白板元信息和当前快照状态。
- `PATCH /boards/:boardId`：更新标题等元信息。
- `DELETE /boards/:boardId`：仅 owner 可删除。
- `GET /boards/:boardId/replay?fromSeq=100`：获取某个 seq 之后的操作列表，用于断线恢复。

## 8. Socket.IO 实时协作方案

### 8.1 连接鉴权

客户端连接时通过 auth 传 token：

```ts
io(URL, {
  auth: {
    token: accessToken,
  },
})
```

服务端在 `io.use()` 中校验 JWT：

- token 有效。
- JTI 未进入 Redis 黑名单。
- 用户存在。
- 将 `userId`、`username` 写入 `socket.data`。

### 8.2 房间模型

- 一个白板对应一个 Socket.IO room。
- room name 建议为 `board:${boardId}`。
- 用户进入白板时 join room。
- 用户离开白板或断开连接时 leave room。

### 8.3 推荐事件协议

客户端发送：

```txt
board:join
board:leave
cursor:update
operation:commit
operation:replay
```

服务端发送：

```txt
board:joined
board:user-joined
board:user-left
cursor:updated
operation:committed
operation:ack
operation:replayed
error
```

### 8.4 操作提交流程

```txt
client
  │
  │ operation:commit
  ▼
socket handler
  │
  │ 校验权限、schema、boardId
  ▼
OperationService.commitOperation()
  │
  ├── 分配 seq
  ├── 写入 BatchWriter 或直接落库
  └── 返回 committed operation
  │
  ▼
Socket.IO room broadcast
  │
  ├── 给提交者返回 ack
  └── 给同房间其他用户广播 operation:committed
```

推荐 ack 语义：

- 客户端提交时带 `clientOpId`。
- 服务端返回 `clientOpId + seq + serverTime`。
- 客户端用 `clientOpId` 将本地 pending 操作标记为已确认。
- 如果 ack 超时，客户端可以重试，服务端应基于 `clientOpId` 或幂等策略避免重复提交。

### 8.5 光标同步

光标更新不需要持久化：

- 客户端高频发送 `cursor:update`。
- 服务端只转发给同 room 的其他用户。
- 建议客户端节流到 30ms ~ 100ms。
- 断开连接时广播 `board:user-left` 或 `cursor:removed`。

### 8.6 断线恢复

推荐流程：

1. 客户端本地记录最后确认的 `seq`。
2. 断线重连后重新 `board:join`。
3. 客户端请求 `operation:replay`，携带 `fromSeq`。
4. 服务端返回 `fromSeq` 之后的操作列表。
5. 客户端按 seq 顺序应用缺失操作。

如果缺失操作过多，服务端可以返回最新 snapshot + snapshot 之后的 operations。

## 9. 协作一致性方案

本项目不建议一开始实现复杂 CRDT。推荐继续使用当前更简单的模型：

```txt
Snapshot + ordered Operation log + replayOps
```

### 9.1 操作日志

每个 operation 至少包含：

- `boardId`
- `seq`
- `userId`
- `opType`
- `elementId`
- `payload`
- `createdAt`

`seq` 是白板内单调递增序号，作为最终顺序来源。

### 9.2 回放

白板加载时：

1. 查询最新 snapshot。
2. 查询 snapshot.seq 之后的 operations。
3. 按 seq 顺序调用 `replayOps`。
4. 得到当前白板状态。

### 9.3 快照压缩

当某个白板 operation 数量超过阈值时：

1. 读取旧 snapshot。
2. 回放后续 operations。
3. 写入新 snapshot。
4. 可选删除已压缩的旧 operations，或保留用于审计。

建议阈值：

- 每 100 ~ 500 个 operation 生成一次 snapshot。
- 或每隔固定时间对活跃白板做 compaction。

## 10. 认证与权限方案

### 10.1 认证

- 密码存储必须使用 bcrypt 或 argon2。
- 登录后签发 access token 和 refresh token。
- HTTP 请求通过 `Authorization: Bearer <token>` 鉴权。
- Socket.IO 连接通过 `auth.token` 鉴权。
- 登出时将 refresh token JTI 写入 Redis 黑名单。

### 10.2 权限

建议权限模型：

- `owner`：可编辑、分享、删除、管理权限。
- `editor`：可查看和编辑。
- `viewer`：仅查看。

权限检查位置：

- HTTP controller 调用 BoardService 前检查。
- Socket.IO `board:join` 时检查是否可进入。
- `operation:commit` 时检查是否可编辑。

## 11. 限流方案

继续保留 Redis sliding window rate limiter。

建议限流维度：

- IP 维度：登录、注册、刷新 token。
- 用户维度：白板创建、operation commit。
- board 维度：高频协作操作保护。

建议限流位置：

- HTTP：Koa middleware。
- Socket.IO：事件级限流 helper，在 `operation:commit` 和 `cursor:update` 中调用。

建议策略：

- 登录：每 IP 每分钟 10 次。
- 注册：每 IP 每小时 20 次。
- 创建白板：每用户每分钟 10 次。
- operation commit：每用户每 board 每秒 30 ~ 60 次。
- cursor update：客户端节流优先，服务端只做兜底保护。

## 12. 错误处理与响应格式

HTTP 响应建议统一格式：

```json
{
  "success": true,
  "data": {}
}
```

错误格式：

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

Socket.IO 错误建议统一：

```ts
socket.emit('error', {
  code: 'FORBIDDEN',
  message: 'No permission to edit this board',
})
```

如果事件使用 ack，优先通过 ack 返回错误：

```ts
ack({
  ok: false,
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many operations',
  },
})
```

## 13. 部署架构

单实例部署：

```txt
Nginx / Caddy
  │
  ▼
Node.js server
  │
  ├── Koa HTTP API
  └── Socket.IO
  │
  ├── PostgreSQL
  └── Redis
```

多实例部署：

```txt
Load Balancer
  │
  ├── Node.js server instance 1
  ├── Node.js server instance 2
  └── Node.js server instance N
        │
        ├── PostgreSQL
        └── Redis
              └── Socket.IO Redis adapter
```

多实例注意事项：

- Socket.IO 需要配置 Redis adapter。
- 负载均衡建议开启 sticky session，或者确保 adapter 配置正确。
- Operation seq 分配必须由数据库事务或 Redis 原子计数保证，避免多实例并发冲突。
- BatchWriter 多实例下要明确每个实例写入边界，或改为直接事务写入关键 operation。

## 14. 测试策略

建议保留并扩展当前测试方向：

- Config 测试：环境变量解析和默认值。
- JWT 测试：签发、校验、过期、JTI。
- Response 测试：统一响应格式。
- Repository 测试：数据访问边界。
- AuthService 测试：注册、登录、刷新、登出。
- RateLimit 测试：Redis sliding window 行为。
- OperationService 测试：seq 分配、replayOps、snapshot 合并。
- Koa route 测试：使用 supertest。
- Socket.IO 测试：使用 socket.io-client 连接测试 join、commit、ack、replay。

## 15. 重构迁移边界

本次重构建议只做这些事情：

- 从 Bun workspace / bun.lock 迁移到 pnpm workspace / pnpm-lock.yaml。
- 服务端运行时改回 Node.js。
- 服务端框架从 Elysia 改回 Koa。
- 实时层从 Elysia WebSocket 或原生 WebSocket 改回 Socket.IO。
- 保留并适配现有 config、JWT、Redis、rate limit、repository、service、operation replay、BatchWriter 和 compaction。
- 前端实时连接从原生 WebSocket 改回 socket.io-client。
- 更新 README、Dockerfile、docker-compose 和启动脚本。

不建议在本次重构中同时做：

- 引入 CRDT。
- 重写整个前端绘图引擎。
- 改 Prisma 数据模型主键策略。
- 引入微服务拆分。
- 引入复杂权限管理后台。
- 重做 UI 设计。

## 16. 推荐迁移顺序

建议按以下顺序执行，降低风险：

1. 迁移 pnpm workspace 和根脚本。
2. 调整服务端依赖：移除 Elysia/Bun 类型，加入 Koa、@koa/router、Socket.IO、supertest。
3. 保留 service、repository、lib、config，先不动业务逻辑。
4. 用 Koa 重建 health/auth/board HTTP route。
5. 用 Socket.IO 重建 board room、cursor、operation、replay 事件。
6. 前端切换回 socket.io-client。
7. 调整 Docker 和 CI 命令。
8. 跑通 auth、board、operation、Socket.IO 集成测试。
9. 删除 Elysia plugin、route 和 Bun 专属入口。
10. 更新 README 与部署文档。

## 17. 成功标准

重构完成后应满足：

- `pnpm install` 可以安装整个 Monorepo。
- `pnpm dev:web` 可以启动前端。
- `pnpm dev:server` 可以在 Node.js 下启动后端。
- HTTP health/auth/board API 可用。
- 用户可以注册、登录、刷新 token、登出。
- 登录用户可以创建、查看、删除白板。
- 多个客户端可以进入同一个白板房间。
- 光标可以实时同步。
- 绘图操作可以实时广播，并通过 ack 确认。
- 断线重连后可以基于 `fromSeq` 回放缺失操作。
- OperationService、BatchWriter、replayOps 和 compaction 的测试通过。
- 项目中不再依赖 Elysia 或 Bun runtime。

