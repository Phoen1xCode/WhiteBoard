# WhiteBoard

这是一个可分享、可实时展示的**在线团队协作白板**，仿照 excalidraw 的界面和功能开发。

## 项目特点

- 多种绘图工具：自由线条、矩形、圆形、直线等
- 实时协作：多人同时编辑，实时同步
- 一键分享：生成分享链接，支持多人查看
- Monorepo 架构：前后端代码统一管理

## 技术栈

### 前端

- 框架：React + TypeScript + Vite
- 绘图引擎：Konva.js + react-konva
- 状态管理：Zustand + Immer
- 校验协议：zod
- 快捷键与手势：react-hotkeys-hook + Pointer Events
- UI: Tailwind CSS + Lucide Icon

### 后端

- 框架：Node.js + Koa
- 实时协作：Socket.IO
- 数据库：PostgreSQL + Prisma

### 工程/运维

- 包管理器：yarn
- 代码质量：ESLint + Prettier
- 部署：Docker 部署

## 功能列表

- [x] 基础架构搭建（Monorepo + Yarn Workspaces）
- [x] 自由线条、矩形、圆形、直线绘制工具
- [x] 实时操作同步（Socket.IO）
- [x] 白板数据持久化（PostgreSQL）
- [x] 基础 REST API（创建/获取白板）
- [x] 颜色选择器、线条粗细调整
- [x] 实线/虚线样式切换
- [x] 元素选中、编辑、删除
- [x] 属性面板（PropertyPanel）
- [x] 元素拖动和变换
- [x] 键盘快捷键支持（工具切换、删除、Undo/Redo）
- [x] Undo/Redo 功能
- [x] 用户光标实时显示
- [x] 橡皮擦工具
- [x] 分享链接复制功能
- [x] 连接状态显示
- [x] 首页白板列表管理
- [x] Docker 部署配置

## 快速开始

### 前置要求

- Node.js >= 18
- Yarn >= 1.22
- PostgreSQL >= 14

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/Phoen1xCode/WhiteBoard.git
cd WhiteBoard
```

2. **安装依赖**

```bash
yarn install
```

3. **配置数据库**

创建 PostgreSQL 数据库，然后配置环境变量：

```bash
# 在项目根目录创建 .env 文件
DATABASE_URL="postgresql://user:password@localhost:5432/whiteboard"
```

4. **运行数据库迁移**

```bash
cd apps/server
yarn prisma:generate
yarn prisma:migrate
cd ../..
```

5. **启动开发服务器**

打开两个终端：

```bash
# 终端 1: 启动后端 (默认端口 3000)
cd apps/server
yarn dev

# 终端 2: 启动前端 (默认端口 5173)
cd apps/web
yarn dev
```

6. **访问应用**

打开浏览器访问：http://localhost:5173

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
│       │   ├── routes/           # 路由定义
│       │   ├── ws/               # WebSocket 处理
│       │   └── prisma/           # Prisma 客户端
│       ├── prisma/
│       │   ├── schema.prisma     # 数据库模型
│       │   └── migrations/       # 数据库迁移文件
│       └── package.json
│
├── packages/
│   └── shared/                   # 共享类型和工具
│       ├── src/
│       │   └── types/            # TypeScript 类型定义
│       └── package.json
│
├── docker/                       # Docker 部署配置
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── entrypoint.sh
│
├── CLAUDE.md
└── package.json                  # 根配置
```

## 架构设计

### 整体架构

WhiteBoard 采用前后端分离的 Monorepo 架构，通过 Yarn Workspaces 统一管理依赖。整体架构分为三层：

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
│                 Board 表 (id, title, snapshot)              │
└─────────────────────────────────────────────────────────────┘
```

### 核心设计理念

#### 1. 实时协作模型

本项目采用基于操作的同步机制实现多人实时协作，这是一种高效且可靠的协作方案：

**工作流程：**

```
客户端 A                    服务器                    客户端 B
   │                         │                         │
   │  1. 加载白板快照 (HTTP) │                         │
   │ ◄─────────────────────  │                         │
   │                         │                         │
   │  2. 加入房间 WebSocket  │                         │
   │ ─────────────────────►  │                         │
   │                         │                         │
   │  3. 本地绘制操作        │                         │
   │  (立即更新 UI)          │                         │
   │                         │                         │
   │  4. 广播操作            │                         │
   │ ─────────────────────►  │  5. 转发操作            │
   │                         │ ─────────────────────►  │
   │                         │                         │
   │                         │  6. 持久化到数据库      │
   │                         │ ─────────────────────► Database
   │                         │                         │
   │                         │  7. 应用操作 (更新 UI)  │
   │                         │                         │
```

三个阶段：

1. 初始同步（Snapshot Loading）

   - 客户端通过 REST API (`GET /api/v1/boards/:id`) 获取白板快照
   - 快照包含所有元素的完整状态
   - 使用 `setInitialElements()` 初始化本地状态

2. 操作流式同步（Operation Streaming）

   - 所有后续修改通过 WebSocket 以操作（Operation）形式传输
   - 操作是轻量级的增量更新，而非完整状态
   - 通过 Socket.IO 的房间机制实现多白板隔离

3. 乐观更新（Optimistic Update）
   - 本地操作立即应用到 UI，无需等待服务器确认
   - 操作同时广播给其他客户端

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
type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";
```

- 自动重连机制（最多 10 次，延迟 1-5 秒）
- 重连后自动重新加入白板房间
- 连接状态实时显示给用户

#### 后端技术方案

**1. REST API 设计**

提供标准的 RESTful API 用于白板 CRUD 操作：

| 方法   | 路径                 | 功能         | 说明           |
| ------ | -------------------- | ------------ | -------------- |
| GET    | `/api/v1/boards`     | 获取白板列表 | 按更新时间倒序 |
| POST   | `/api/v1/boards`     | 创建新白板   | 返回空白板快照 |
| GET    | `/api/v1/boards/:id` | 获取白板详情 | 返回完整快照   |
| DELETE | `/api/v1/boards/:id` | 删除白板     | 物理删除       |

**2. WebSocket 事件系统**

基于 Socket.IO 实现的实时通信协议：

**客户端 → 服务器：**

| 事件          | 数据                  | 功能         |
| ------------- | --------------------- | ------------ |
| `join-board`  | `{ boardId }`         | 加入白板房间 |
| `leave-board` | `{ boardId }`         | 离开白板房间 |
| `op`          | `WhiteBoardOperation` | 发送操作     |
| `cursor`      | `{ boardId, x, y }`   | 发送光标位置 |

**服务器 → 客户端：**

| 事件     | 数据                  | 功能             |
| -------- | --------------------- | ---------------- |
| `op`     | `WhiteBoardOperation` | 接收其他用户操作 |
| `cursor` | `{ clientId, x, y }`  | 接收其他用户光标 |

**3. 房间隔离机制**

使用 Socket.IO 的房间（Room）功能实现多白板隔离：

```typescript
// 客户端加入房间
socket.join(boardId);

// 广播给房间内其他客户端
socket.to(boardId).emit("op", operation);
```

**4. 数据持久化策略**

采用 **快照 + 实时持久化** 的混合策略：

- **快照存储**：完整的白板状态存储在 `Board.snapshot` JSON 字段
- **实时持久化**：每个操作在转发给其他客户端的同时，异步持久化到数据库
- **错误处理**：持久化失败不影响实时协作，仅记录错误日志

```typescript
// 操作持久化流程
socket.on("op", async (operation) => {
  // 1. 立即转发给其他客户端（优先保证实时性）
  socket.to(boardId).emit("op", operation);

  // 2. 异步持久化到数据库
  try {
    await applyOperationToSnapshot(boardId, operation);
  } catch (error) {
    console.error("Failed to persist operation:", error);
  }
});
```

#### 数据库设计

**Board 表结构：**

```prisma
model Board {
  id        String   @id @default(cuid())
  title     String
  snapshot  Json     // { elements: [...] }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔧 开发命令

```bash
# 安装依赖
yarn install

# 前端开发
cd apps/web && yarn dev

# 后端开发
cd apps/server && yarn dev

# Prisma 相关
cd apps/server
yarn prisma:generate   # 生成 Prisma Client
yarn prisma:migrate    # 运行数据库迁移
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

| 服务     | 端口 | 说明                 |
| -------- | ---- | -------------------- |
| web      | 8080 | 前端 Nginx 服务      |
| server   | 3000 | 后端 API + WebSocket |
| postgres | 5432 | PostgreSQL 数据库    |

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
