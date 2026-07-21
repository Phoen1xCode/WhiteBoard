# WhiteBoard

这是一个可分享、可实时展示的**在线团队协作白板**，仿照 excalidraw 的界面和功能开发。

## 项目特点

- 账号认证（JWT access/refresh + Redis 黑名单）
- 白板权限：owner / editor / viewer
- 多种绘图工具：自由线条、矩形、圆形、直线等
- 实时协作：Socket.IO operation commit/ack/replay
- 有序 operation log（boardId + seq）
- Monorepo：pnpm workspace

## 技术栈

当前运行时与框架（不是 Bun / Elysia）：

### 前端

- React + TypeScript + Vite
- Konva.js + react-konva
- Zustand + Immer
- socket.io-client
- Zod、Tailwind CSS、Lucide

### 后端

- Node.js + Koa + @koa/router
- Socket.IO
- PostgreSQL + Prisma
- Redis（限流、JWT 黑名单；本地测试可用 `REDIS_URL=memory://`）
- JWT（jsonwebtoken）

### 工程/运维

- pnpm workspace
- Docker Compose（web / server / postgres / redis）

更完整的目标架构与重构计划见：

- `docs/architecture-node-pnpm-koa-socketio.md`
- `docs/refactor-from-fcca376-plan.md`

## 功能列表

- [x] pnpm monorepo + shared 类型/schema
- [x] 注册 / 登录 / 刷新 / 登出 / me
- [x] 认证后的白板 CRUD + 权限
- [x] OperationService（原子 seq、replayOps、fromSeq）
- [x] Socket.IO：`board:join` / `operation:commit` / `operation:replay` / `cursor:update`
- [x] 前端登录页、Bearer API、socket auth.token、断线 replay
- [x] 基础绘图工具与 Konva UI
- [ ] BatchWriter / snapshot compaction（后续）
- [ ] 多实例 Socket.IO Redis adapter（后续）

## 快速开始

### 前置要求

- Node.js >= 20.19（建议 20/22/24 LTS）
- pnpm >= 11
- PostgreSQL >= 14
- Redis（生产/完整本地联调）；单测可用内存 Redis

### 安装步骤

1. **克隆仓库并安装依赖**

```bash
git clone https://github.com/Phoen1xCode/WhiteBoard.git
cd WhiteBoard
pnpm install
```

2. **配置服务端环境变量**

```bash
cp apps/server/.env.example apps/server/.env
# 编辑 DATABASE_URL / REDIS_URL / JWT_* 密钥
```

关键变量：

```bash
DATABASE_URL=postgresql://whiteboard:whiteboardpassword@localhost:5432/whiteboard
PORT=4000
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret
```

前端默认请求 `http://localhost:4000`（可用 `VITE_API_BASE` / `VITE_WS_URL` 覆盖）。

3. **数据库迁移**

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

4. **启动**

```bash
# 终端 1: 后端默认 http://localhost:4000
pnpm dev:server

# 终端 2: 前端默认 http://localhost:5173
pnpm dev:web
```

5. **使用**

打开 http://localhost:5173 ，先注册/登录，再创建白板。未登录访问受保护路由会跳转登录页；未带 token 的 HTTP board API 返回 401，Socket 无 token 无法连接。

### 测试

```bash
pnpm test
# 或
pnpm --filter @whiteboard/server test
```

集成测试默认使用内存 Redis（`REDIS_URL=memory://`），不强制本机 PostgreSQL。完整双客户端 E2E 需要本机 Postgres + Redis。

## 项目结构

```
WhiteBoard/
├── apps/
│   ├── web/                      # 前端应用
│   │   ├── src/
│   │   │   ├── components/       # React 组件
│   │   │   │   ├── board/        # 白板相关组件
│   │   │   │   ├── style/        # 样式控制组件
│   │   │   │   └── ui/           # 通用 UI 组件
│   │   │   ├── pages/            # 页面组件
│   │   │   ├── store/            # Zustand 状态管理
│   │   │   ├── hooks/            # 自定义 Hooks
│   │   │   ├── lib/              # 工具函数
│   │   │   └── styles/           # 全局样式
│   │   └── package.json
│   │
│   └── server/                   # 后端应用
│       ├── src/
│       │   ├── controllers/      # 控制器
│       │   ├── services/         # 业务逻辑
│       │   ├── repositories/     # 数据访问
│       │   ├── routes/           # 路由定义
│       │   ├── sockets/          # Socket.IO 事件
│       │   ├── middleware/       # auth / rate-limit 等
│       │   └── lib/              # jwt / redis / prisma
│       ├── prisma/
│       │   ├── schema.prisma     # 数据库模型
│       │   └── migrations/       # 数据库迁移文件
│       └── package.json
│
├── packages/
│   └── shared/                   # 共享类型与 schema
│       ├── src/
│       │   ├── types/            # whiteboard / socket 类型
│       │   └── schemas/          # Zod schema
│       └── package.json
│
├── docker/                       # Docker 部署配置
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── entrypoint.sh
│
├── docs/                         # 架构与重构计划
├── AGENTS.md                     # agent 项目记忆（CLAUDE.md 为其软链接）
└── package.json                  # 根配置
```

## 架构设计

### 整体架构

WhiteBoard 采用前后端分离的 Monorepo 架构，通过 pnpm workspace 统一管理依赖。整体架构分为三层：

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Canvas 渲染 │  │  状态管理    │  │  WebSocket   │       │
│  │  (Konva.js)  │  │  (Zustand)   │  │  客户端      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                      后端层 (Node.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  REST API    │  │  Socket.IO   │  │  业务逻辑    │       │
│  │  (Koa)       │  │  服务器      │  │  (Service)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                    数据持久层 (PostgreSQL)                  │
│          PostgreSQL + Redis（限流 / JWT 黑名单）           │
└─────────────────────────────────────────────────────────────┘
```

### 核心设计理念

#### 1. 实时协作模型

本项目采用基于操作的同步机制实现多人实时协作，这是一种高效且可靠的协作方案：

**工作流程：**

```
客户端 A                    服务器                    客户端 B
   │                         │                         │
   │  1. JWT + 快照/lastSeq  │                         │
   │     (HTTP Bearer)       │                         │
   │ ◄─────────────────────  │                         │
   │                         │                         │
   │  2. board:join          │                         │
   │     (auth.token)        │                         │
   │ ─────────────────────►  │                         │
   │                         │                         │
   │  3. 本地乐观更新 UI     │                         │
   │  4. operation:commit    │                         │
   │ ─────────────────────►  │  5. authorize → persist │
   │                         │     (boardId+seq)       │
   │  6. ack 提交者          │                         │
   │ ◄─────────────────────  │  7. operation:committed │
   │                         │ ─────────────────────►  │
   │                         │                         │  8. 应用 op 更新 UI
```

三个阶段：

1. 初始同步（Snapshot Loading）

   - 带 Bearer token 调用 `GET /api/v1/boards/:id`，拿快照 + `lastSeq`
   - 使用 `setInitialElements()` 初始化本地状态
   - Socket 以 `auth.token` 连接后 `board:join`

2. 操作提交（operation:commit）

   - 本地先乐观应用，再 `operation:commit`
   - 服务端：`authorize → persist（原子 boardId+seq）→ ack 提交者 → broadcast 其他人`
   - 断线后用 `lastSeq` 走 `operation:replay`

3. 乐观更新与回滚
   - UI 立即更新；若 commit 被服务端确定性拒绝，客户端回滚本地 op

#### 2. 操作类型定义

所有白板修改通过 `WhiteBoardOperation` 类型定义，确保类型安全和一致性：

```typescript
type WhiteBoardOperation =
  | { type: "add"; boardId: string; element: WhiteBoardElement }
  | {
      type: "update";
      boardId: string;
      elementId: string;
      changes: Partial<WhiteBoardElement>;
    }
  | { type: "delete"; boardId: string; elementId: string }
  | { type: "clear"; boardId: string };
```

**操作类型说明：**

- **`add`** - 添加新元素到画板（绘制新图形）
- **`update`** - 修改现有元素属性（拖动、缩放、改变样式）
- **`delete`** - 删除指定元素（橡皮擦、删除键）
- **`clear`** - 清空整个画板

#### 3. 状态管理架构

使用 **Zustand + Immer** 实现不可变状态管理：

**核心状态结构：**

```typescript
{
  elements: Record<string, WhiteBoardElement>,  // 元素字典，O(1) 查找
  currentTool: ShapeType,                       // 当前工具
  currentStyle: DrawingStyle,                   // 当前样式
  selectedElementId: string | null,             // 选中元素
  undoStack: HistoryEntry[],                    // 撤销栈
  redoStack: HistoryEntry[]                     // 重做栈
}
```

**操作应用逻辑：**

```typescript
applyOperation(operation, { local, recordHistory });
```

- `local: true` - 本地操作，需要广播给其他客户端
- `local: false` - 远程操作，仅应用到本地状态
- `recordHistory: true` - 记录到历史栈，支持撤销/重做

#### 4. 撤销/重做机制

实现了完整的 Undo/Redo 功能，基于逆向操作模式：

**工作原理：**

1. 每个操作执行时，自动生成其逆向操作
2. 原始操作和逆向操作作为一对存入历史栈
3. 撤销时应用逆向操作，重做时重新应用原始操作
4. 撤销/重做操作同样通过 WebSocket 同步给其他客户端

**逆向操作映射：**

| 原始操作            | 逆向操作                   |
| ------------------- | -------------------------- |
| add(element)        | delete(elementId)          |
| delete(elementId)   | add(element)               |
| update(id, changes) | update(id, originalValues) |

**历史栈管理：**

- 限制最大容量为 50 条，防止内存溢出
- 执行新操作时自动清空重做栈
- 支持跨客户端的撤销/重做同步

### 技术方案详解

#### 前端技术方案

**1. Canvas 渲染引擎 (Konva.js)**

选择 Konva.js 作为渲染引擎的原因：

- 基于 Canvas API，性能优异
- 提供完整的图形变换能力（拖动、缩放、旋转）
- 支持事件系统，易于实现交互
- React 集成良好（react-konva）

**核心渲染流程：**

```typescript
Canvas 组件
  ├─ Stage (画布容器)
  │   ├─ Layer (图层)
  │   │   ├─ 已保存元素渲染 (elements.map(renderElement))
  │   │   ├─ 正在绘制元素渲染 (currentShape)
  │   │   └─ Transformer (选中元素的变换控制器)
```

**2. 绘图工具实现**

支持多种绘图工具，每种工具有独立的绘制逻辑：

| 工具                | 实现方式           | 数据结构                        |
| ------------------- | ------------------ | ------------------------------- |
| 自由线条 (freehand) | 记录鼠标轨迹点数组 | `points: [x1, y1, x2, y2, ...]` |
| 矩形 (rectangle)    | 起点 + 宽高        | `x, y, width, height`           |
| 圆形 (circle)       | 圆心 + 半径        | `x, y, radius`                  |
| 直线 (line)         | 起点 + 终点        | `points: [x1, y1, x2, y2]`      |
| 选择 (select)       | Transformer 控制   | 无数据，仅交互                  |
| 橡皮擦 (eraser)     | 碰撞检测 + 删除    | 无数据，仅交互                  |

**3. 实时光标显示**

实现了多用户光标位置的实时显示：

```typescript
// 发送光标位置
sendCursor(boardId, x, y);

// 接收其他用户光标
onCursor((data: { clientId; x; y }) => {
  // 渲染其他用户的光标
});
```

**4. 连接状态管理**

实现了完善的 WebSocket 连接状态管理：

```typescript
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";
```

- 自动重连机制（最多 10 次，延迟 1-5 秒）
- 重连后自动重新加入白板房间
- 连接状态实时显示给用户

#### 后端技术方案

**1. REST API 设计**

除注册/登录/刷新外，HTTP API 需 `Authorization: Bearer <accessToken>`。

**认证：**

| 方法 | 路径                    | 功能                     |
| ---- | ----------------------- | ------------------------ |
| POST | `/api/v1/auth/register` | 注册                     |
| POST | `/api/v1/auth/login`    | 登录（access + refresh） |
| POST | `/api/v1/auth/refresh`  | 刷新 access              |
| POST | `/api/v1/auth/logout`   | 登出（JWT 黑名单）       |
| GET  | `/api/v1/auth/me`       | 当前用户                 |

**白板（需登录；按 owner/editor/viewer 鉴权）：**

| 方法   | 路径                 | 功能         | 说明             |
| ------ | -------------------- | ------------ | ---------------- |
| GET    | `/api/v1/boards`     | 获取白板列表 | 当前用户可访问   |
| POST   | `/api/v1/boards`     | 创建新白板   | 创建者为 owner   |
| GET    | `/api/v1/boards/:id` | 获取白板详情 | 快照 + `lastSeq` |
| PATCH  | `/api/v1/boards/:id` | 更新标题     | owner/editor     |
| DELETE | `/api/v1/boards/:id` | 删除白板     | 仅 owner         |

**2. WebSocket 事件系统**

基于 Socket.IO；握手通过 `auth.token`（JWT access）。房间名 `board:{boardId}`。

**客户端 → 服务器：**

| 事件               | 数据                                  | 功能                 |
| ------------------ | ------------------------------------- | -------------------- |
| `board:join`       | `{ boardId }`                         | 加入白板房间         |
| `board:leave`      | `{ boardId }`                         | 离开白板房间         |
| `operation:commit` | `{ boardId, operation, clientOpId? }` | 提交操作（ack）      |
| `operation:replay` | `{ boardId, fromSeq }`                | 拉取 `seq > fromSeq` |
| `cursor:update`    | `{ boardId, x, y }`                   | 发送光标             |

**服务器 → 客户端：**

| 事件                                    | 数据                 | 功能             |
| --------------------------------------- | -------------------- | ---------------- |
| `board:joined` / ack                    | members 等           | join 成功        |
| `board:user-joined` / `board:user-left` | user / socketId      | 成员变更         |
| `operation:committed`                   | 含 `seq` 的已提交 op | 广播给房间其他人 |
| `operation:replayed` / ack              | ops 列表             | 断线补齐         |
| `cursor:updated`                        | userId, x, y…        | 他人光标         |

**3. operation:commit 路径**

`authorize → persist（boardId+seq 原子写入 + snapshot）→ ack 提交者 → broadcast 其他人`。

幂等 `clientOpId` 命中时只 ack，不重复广播。

**4. 数据与重连**

- `Board.snapshot` 与 op log 在同一事务更新；`getBoard` 在行锁下原子读 snapshot + `lastSeq`
- 客户端用 `lastSeq` 做 `operation:replay`，只补 `seq > lastSeq`

#### 数据库设计（核心）

```prisma
model Board {
  id        String   @id @default(cuid())
  title     String
  snapshot  Json     // { elements: [...] }
  ownerId   String?
  // permissions / operations / snapshots 关系略
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Operation {
  id         String  @id @default(cuid())
  boardId    String
  seq        Int
  opType     String
  clientOpId String?
  payload    Json
  @@unique([boardId, seq])
  @@unique([boardId, clientOpId])
}
```

## 🔧 开发命令

```bash
# 安装依赖
pnpm install

# 前端开发
pnpm dev:web

# 后端开发
pnpm dev:server

# Prisma 相关
pnpm prisma:generate   # 生成 Prisma Client
pnpm prisma:migrate    # 运行数据库迁移
```

## Docker 部署

### 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

### 部署命令

```bash
# 进入 docker 目录并启动所有服务
cd docker && docker compose up -d --build
```

### 详细部署步骤

1. **配置环境变量（可选）**

```bash
# 复制环境变量示例文件
cp docker/.env.docker.example docker/.env.docker

# 编辑配置（可选，默认配置可直接使用）
vim docker/.env.docker
```

2. **构建并启动服务**

```bash
# 进入 docker 目录
cd docker

# 构建并启动所有服务（使用自定义环境变量）
docker compose --env-file .env.docker up -d --build

# 或直接使用默认配置启动
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f server
```

### 常用 Docker 命令

```bash
# 停止所有服务
cd docker && docker-compose down

# 停止并删除数据卷
cd docker && docker-compose down -v

# 重新构建并启动
cd docker && docker-compose up -d --build

# 仅重启某个服务
cd docker && docker-compose restart server
```

### Docker 服务说明

| 服务     | 端口 | 说明                                     |
| -------- | ---- | ---------------------------------------- |
| web      | 8080 | 前端 Nginx 服务                          |
| server   | 3000 | 后端 API + WebSocket（容器内 PORT=3000） |
| postgres | 5432 | PostgreSQL 数据库                        |
| redis    | 6379 | 限流 + JWT 黑名单                        |

### Docker 文件结构

```
docker/
├── Dockerfile           # 多阶段构建文件
├── docker-compose.yml   # 服务编排配置
├── nginx.conf           # Nginx 配置
├── entrypoint.sh        # 服务器启动脚本（含数据库迁移）
└── .env.docker.example  # 环境变量示例
```

## ⌨️ 键盘快捷键

| 快捷键                   | 功能             |
| ------------------------ | ---------------- |
| `P`                      | 切换到画笔工具   |
| `R`                      | 切换到矩形工具   |
| `O`                      | 切换到圆形工具   |
| `L`                      | 切换到直线工具   |
| `E`                      | 切换到橡皮擦工具 |
| `Delete` / `Backspace`   | 删除选中元素     |
| `Ctrl+Z` / `Cmd+Z`       | 撤销             |
| `Ctrl+Y` / `Cmd+Shift+Z` | 重做             |
| `Escape`                 | 取消选中         |

## 作者

[@Phoen1xCode](https://github.com/Phoen1xCode)
