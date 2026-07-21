# 从 fcca376 重构到目标架构的功能添加计划

> 当前重构基线：`fcca376 chore: add .worktrees/ to .gitignore for git worktree isolation`。
>
> 目标架构：Node.js 运行时 + pnpm workspace + Koa HTTP API + Socket.IO 实时协作 + PostgreSQL/Prisma + Redis + JWT 认证 + 限流 + Repository + Operation replay + BatchWriter + Snapshot compaction。

## 1. 当前基线状态

reset 到 `fcca376` 后，项目处于 Bun 引入之前的状态。

当前已有能力：

- React + TypeScript + Vite 前端。
- Konva/react-konva 白板绘制。
- Zustand/Immer 状态管理。
- Koa 服务端。
- Socket.IO 实时协作。
- PostgreSQL + Prisma 基础白板持久化。
- 基础 board REST API。
- 基础 socket 房间与操作同步。
- pnpm workspace。

当前缺失能力：

- 用户认证模型。
- JWT 登录、刷新、登出。
- Redis 客户端封装。
- JWT JTI 黑名单。
- Redis sliding window 限流。
- Repository 分层。
- User/Permission/Operation/Snapshot 等完整领域模型。
- OperationService。
- replayOps。
- BatchWriter。
- Snapshot compaction。
- HTTP 与 Socket.IO 共享的权限检查。
- 断线后按 seq 补放缺失操作。

## 2. 总体迁移原则

本次重构采用“保留旧 Koa/Socket.IO 框架，逐步移植后端领域能力”的方式。

原则：

- 不整块 cherry-pick Bun/Elysia 之后的提交。
- 只按模块移植可复用代码。
- 每一步都保持项目可运行。
- service 和 repository 优先，framework glue 后置。
- HTTP 和 Socket.IO 都复用同一套 service。
- 不引入 Bun runtime、Bun lockfile 或 Elysia。
- 不在本轮引入 CRDT 或大规模前端重写。

可参考的备份分支：

```txt
origin/feature-refactor
```

该分支保留 reset 前的完整代码与文档，可从中人工移植后端领域能力。

## 3. 阶段一：迁移到 pnpm workspace

目标：先完成包管理器迁移，不改业务逻辑。

改动内容：

- 新增 `pnpm-workspace.yaml`。
- 删除旧包管理器 lockfile。
- 生成 `pnpm-lock.yaml`。
- 根 `package.json` 增加统一脚本。
- 子包依赖保持原版本优先，不做大版本升级。

建议根脚本以根目录 `package.json` 的 `scripts` 为准（当前 `lint`/`fmt` 为 oxlint/oxfmt，不再 per-package eslint）。

验证标准：

- `pnpm install` 成功。
- `pnpm dev:web` 成功启动前端。
- `pnpm dev:server` 成功启动旧 Koa/Socket.IO 服务。
- 旧白板创建、进入、绘制、实时同步仍可用。

## 4. 阶段二：整理服务端基础设施目录

目标：为后续认证、限流、仓库层做目录准备。

建议新增目录：

```txt
apps/server/src/config/
apps/server/src/lib/
apps/server/src/middleware/
apps/server/src/repositories/
apps/server/src/services/
apps/server/src/sockets/
apps/server/src/types/
```

当前旧文件可逐步迁移：

- `controllers/boardsController.ts` 保留，后续改为薄 controller。
- `routes/boards.ts` 保留，后续接入 auth 和 validation。
- `services/boardsService.ts` 后续拆为 `BoardService`。
- `ws/socket.ts` 后续改为 Socket.IO 事件注册模块。

验证标准：

- 目录调整后服务仍可启动。
- 不改变 HTTP 路由行为。
- 不改变 Socket.IO 事件行为。

## 5. 阶段三：升级 Prisma 领域模型

目标：从单一 Board 模型升级到协作白板领域模型。

需要加入或确认的模型：

- `User`
- `Board`
- `Permission`
- `Operation`
- `Snapshot`

目标关系：

- User 拥有多个 Board。
- Board 拥有多个 Operation。
- Board 拥有多个 Snapshot。
- User 与 Board 通过 Permission 建立协作权限。
- Operation 使用 `boardId + seq` 保证单白板内顺序。

迁移建议：

- 优先参考 `origin/feature-refactor` 中的 `apps/server/prisma/schema.prisma`。
- 不直接引入 Bun/Prisma 7 相关配置，优先沿用 Node 下稳定 Prisma 配置。
- 如果需要升级 Prisma 版本，单独提交，不和模型变更混在一起。

验证标准：

- `pnpm --filter @whiteboard/server prisma:generate` 成功。
- `pnpm --filter @whiteboard/server prisma:migrate` 成功。
- 旧 board 数据迁移路径明确，至少开发环境可重建数据库。

## 6. 阶段四：添加基础库

目标：把框架无关基础能力加回来。

建议新增模块：

```txt
src/config/index.ts
src/lib/prisma.ts
src/lib/redis.ts
src/lib/jwt.ts
src/lib/response.ts
```

职责：

- `config`：读取并校验环境变量。
- `prisma`：导出 PrismaClient 单例。
- `redis`：封装 ioredis 客户端。
- `jwt`：封装 access/refresh token 签发与校验。
- `response`：统一 HTTP 成功/失败响应结构。

依赖：

```txt
dotenv
jsonwebtoken
ioredis
zod
bcryptjs
```

验证标准：

- config 测试通过。
- jwt 签发/校验测试通过。
- response helper 测试通过。
- Redis 未启动时错误信息明确。

## 7. 阶段五：添加 Repository 层

目标：把 Prisma 访问从 controller/service 中隔离。

建议新增：

```txt
src/repositories/user.repository.ts
src/repositories/board.repository.ts
src/repositories/permission.repository.ts
src/repositories/operation.repository.ts
src/repositories/snapshot.repository.ts
```

迁移来源：

- 可参考 `origin/feature-refactor` 中的 repository 实现。
- 只保留数据访问逻辑，不移植 Elysia/Bun 相关代码。

验证标准：

- Board 创建、查询、删除走 repository。
- User 查询和创建走 repository。
- Operation 按 `boardId + seq` 查询走 repository。
- Repository 不依赖 Koa ctx 或 Socket.IO socket。

## 8. 阶段六：添加认证服务与 HTTP 路由

目标：加回用户注册、登录、刷新、登出。

新增服务：

```txt
src/services/auth.service.ts
```

新增路由：

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

新增 middleware：

```txt
src/middleware/auth.ts
src/middleware/validate.ts
src/middleware/error.ts
```

认证策略：

- access token 短有效期。
- refresh token 长有效期。
- token payload 包含 `sub`、`jti`、`type`、`exp`。
- logout 时将 JTI 写入 Redis 黑名单。

验证标准：

- 注册成功后创建 User。
- 登录成功后返回 access token 和 refresh token。
- 无 token 访问受保护路由返回 401。
- 黑名单 token 不可继续使用。
- auth service 单元测试通过。

## 9. 阶段七：添加 Redis 限流

目标：恢复 Redis sliding window rate limiter。

新增模块：

```txt
src/middleware/rate-limit.ts
```

使用位置：

- HTTP 登录。
- HTTP 注册。
- HTTP 创建白板。
- Socket.IO `operation:commit`。
- Socket.IO `cursor:update` 可做轻量保护。

建议 key：

```txt
rate:ip:{ip}:login
rate:ip:{ip}:register
rate:user:{userId}:board:create
rate:board:{boardId}:user:{userId}:op
```

验证标准：

- 限流窗口内超过阈值返回 429。
- Redis key 自动过期。
- rate-limit 测试通过。

## 10. 阶段八：重构 BoardService 与权限

目标：把白板 API 升级为认证后的多用户协作模型。

BoardService 职责：

- 创建白板。
- 创建 owner permission。
- 查询当前用户可访问白板列表。
- 获取白板详情。
- 更新白板标题。
- 删除白板。
- 校验访问权限。
- 校验编辑权限。

权限角色：

```txt
owner
editor
viewer
```

验证标准：

- 登录用户创建白板后自动成为 owner。
- 非成员无法访问白板。
- viewer 不能提交编辑操作。
- owner 可以删除白板。

## 11. 阶段九：添加 OperationService 与 replayOps

目标：把实时同步从“直接广播元素状态”升级为“提交有序 operation”。

OperationService 职责：

- 校验 operation payload。
- 为每个 board 分配单调递增 seq。
- 写入 operation log。
- 从 snapshot + operations 回放当前白板状态。
- 支持 `fromSeq` 增量回放。

核心 API：

```ts
commitOperation(input);
getOperationsAfter(boardId, fromSeq);
replayBoard(boardId);
replayOps(snapshot, operations);
```

验证标准：

- 同一个 board 的 seq 连续递增。
- replayOps 能从空状态恢复完整白板。
- replayOps 能从 snapshot 恢复后续状态。
- operation service 测试通过。

## 12. 阶段十：重构 Socket.IO 协作协议

目标：保留 Socket.IO，但事件语义升级到 operation log 模型。

推荐客户端事件：

```txt
board:join
board:leave
cursor:update
operation:commit
operation:replay
```

推荐服务端事件：

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

连接鉴权：

- 使用 `io.use()` 校验 JWT。
- 校验通过后写入 `socket.data.user`。
- `board:join` 时校验访问权限。
- `operation:commit` 时校验编辑权限。

ack 设计：

- 客户端提交时带 `clientOpId`。
- 服务端 ack 返回 `clientOpId`、`seq`、`serverTime`。
- 客户端根据 ack 清理 pending operation。

验证标准：

- 多客户端加入同一白板 room。
- 一个客户端提交 operation，其他客户端收到广播。
- 提交者收到 ack。
- 断线重连后可用 `operation:replay` 补齐缺失操作。

## 13. 阶段十一：添加 BatchWriter 与 compaction

目标：降低高频协作写库压力，并控制 operation log 长期增长。

BatchWriter 职责：

- 暂存高频 operation。
- 按时间或数量批量落库。
- 服务关闭时 flush。

Compaction 职责：

- 定期生成 snapshot。
- 将旧 operation 合并进 snapshot 状态。
- 可选清理已压缩 operation。

注意：

- 单实例下实现简单。
- 多实例下必须重新评估 seq 分配和 BatchWriter 边界。
- 如果短期要支持多实例，关键 operation 建议先直接事务落库，BatchWriter 只作为后续优化。

验证标准：

- BatchWriter flush 测试通过。
- compaction 后 replay 结果不变。
- 服务 SIGINT/SIGTERM 时未写入 operation 不丢失。

## 14. 阶段十二：前端适配认证与新 Socket.IO 协议

目标：让前端使用认证后的 API 和 operation-based socket 协议。

前端改动：

- 添加 auth API client。
- 保存 access token/refresh token。
- Socket.IO 连接时携带 token。
- `useBoardSync` 从旧事件改为 operation 事件。
- 本地操作先乐观应用，再等待 ack。
- 记录最后确认 seq，用于断线恢复。

验证标准：

- 未登录用户无法进入受保护白板。
- 登录后可以创建和进入白板。
- 绘图操作实时同步。
- 断线重连后状态可恢复。

## 15. 阶段十三：更新 Docker 与文档

目标：让部署文档与 Node + pnpm + Koa + Socket.IO 架构一致。

改动：

- Dockerfile 使用 Node base image。
- 使用 `corepack enable` 或显式安装 pnpm。
- 启动命令改为 Node 服务端构建产物。
- docker-compose 保留 PostgreSQL 和 Redis。
- README 更新技术栈、启动命令、环境变量。

验证标准：

- Docker build 成功。
- docker-compose 可启动 web/server/postgres/redis。
- README 不再出现 Bun/Elysia 作为当前技术栈。

## 16. 推荐提交拆分

建议按以下提交粒度推进：

```txt
chore(workspace): migrate to pnpm
refactor(server): prepare node koa service structure
feat(database): add collaboration domain models
feat(server): add config jwt redis helpers
feat(server): add repository layer
feat(server): add auth service and routes
feat(server): add redis rate limiter
feat(server): add board permission service
feat(server): add operation replay service
feat(server): add socketio collaboration events
feat(server): add batch writer and compaction
feat(web): adapt auth and socketio operation sync
chore(docker): update node pnpm deployment
```

## 17. 最小可验收版本

如果希望先得到一个小闭环，建议最小版本只包含：

- pnpm workspace。
- Node + Koa + Socket.IO 可启动。
- User/Board/Permission/Operation/Snapshot 模型。
- 注册、登录、鉴权。
- 创建白板。
- 加入白板 room。
- 提交 operation。
- operation 广播。
- 按 `fromSeq` replay。

暂缓：

- BatchWriter。
- compaction。
- 多实例 Redis adapter。
- 复杂权限管理 UI。
- 完整 refresh token 轮换策略。
