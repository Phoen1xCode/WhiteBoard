# WhiteBoard

这是一个可分享、可实时展示的**在线团队协作白板**，仿照 excalidraw 的界面和功能开发。

## 技术栈

### 前端

- 框架：React + TypeScript + Vite
- 绘图引擎：Konva.js + react-konva
- 状态管理：Zustand + Immer
- 校验协议：zod
- 快捷键与手势：react-hotkeys-hook + Pointer Events
- UI: Tailwind CSS + Radix UI + Lucide Icon

### 后端

- 框架：Node.js + Koa
- 实时协作：Socket.IO
- 数据库：PostgreSQL + Prisma
- 缓存层：Redis

### 工程/运维

- 包管理器：yarn
- 代码质量：ESLint + Prettier
- 测试：Vitest（单测）+ Playwright（E2E）
- 部署：Docker 部署

## How to dev

```bash
git clone https://github.com/Phoen1xCode/WhiteBoard.git

yarn install

yarn dev
```
