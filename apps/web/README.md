# @whiteboard/web

React + Vite 前端。开发服务器默认 `http://localhost:5173`。

## 前置条件

- Node.js >= 20.19
- pnpm >= 11
- 后端 `@whiteboard/server` 已启动（默认 `http://localhost:4000`）

在**仓库根目录**安装依赖：

```bash
pnpm install
```

## 环境变量

可选。不配置时默认连本机后端 `http://localhost:4000`。

在本目录创建 `.env` 或 `.env.local`：

```env
# HTTP API
VITE_API_BASE=http://localhost:4000

# Socket.IO（可与 API 同主机）
VITE_WS_URL=http://localhost:4000
```

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE` | 否 | REST 基地址，默认 `http://localhost:4000` |
| `VITE_WS_URL` | 否 | WebSocket 地址，默认 `http://localhost:4000` |

修改后需重启 Vite。

## 运行

先确保后端可用，再启动前端：

```bash
# 仓库根目录
pnpm dev:web

# 或本包
pnpm dev
```

浏览器打开终端里提示的本地地址（一般是 `http://localhost:5173`）。

## 构建与预览

```bash
pnpm build
pnpm preview
```

`build` 会先跑 `tsc -b`，再执行 `vite build`。

## 本地联调顺序

1. 按 `apps/server/README.md` 配好 Postgres / JWT，并 `pnpm prisma:migrate`
2. `pnpm dev:server`
3. （可选）配置本包 `VITE_*`
4. `pnpm dev:web`
5. 打开页面注册/登录，创建白板

## 常用脚本

| 脚本 | 作用 |
| --- | --- |
| `pnpm dev` | Vite 开发服务器 |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建产物 |

## 目录要点

- `src/pages`：登录、首页、白板页
- `src/components/board`：画布、工具栏、光标等
- `src/lib/api.ts` / `src/lib/socket.ts`：HTTP 与 Socket 客户端
- `src/store`：Zustand 白板状态
