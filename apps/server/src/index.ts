import type { Server as HttpServer } from "node:http";

import { serve } from "@hono/node-server";
import { Server } from "socket.io";

import { createApp } from "@/app";
import { loadConfig } from "@/config";
import { createAuthMiddleware } from "@/modules/auth/auth.middleware";
import { createAuthRouter } from "@/modules/auth/auth.router";
import { createAuthService } from "@/modules/auth/auth.service";
import { createBetterAuth } from "@/modules/auth/better-auth";
import { createTokenResolver } from "@/modules/auth/token";
import { createBoardAccess } from "@/modules/boards/board-access";
import { createBoardsRouter } from "@/modules/boards/boards.router";
import { createBoardsService } from "@/modules/boards/boards.service";
import { createOperationsService } from "@/modules/boards/operations.service";
import { createCollaboration } from "@/modules/realtime/collaboration";
import { createPresence } from "@/modules/realtime/presence";
import { createSocketServer } from "@/modules/realtime/socket";
import { createPrismaClient } from "@/shared/prisma";

const config = loadConfig();
const prisma = createPrismaClient(config);

const auth = createBetterAuth({ prisma, config });
const resolveAccessToken = createTokenResolver(auth);
const authService = createAuthService({ prisma, auth });
const authMiddleware = createAuthMiddleware(resolveAccessToken);

const boardAccess = createBoardAccess({ prisma });
const boardsService = createBoardsService({ prisma, boardAccess });
const operationsService = createOperationsService({ prisma, boardAccess });

const presence = createPresence({ boardAccess });
const collaboration = createCollaboration({ presence, operationsService });

// Late-bound: logout (HTTP) must disconnect sockets, but io only exists after
// the HTTP server is listening. Assigned right after createSocketServer below.
let disconnectUserSockets: (userId: string) => void = () => {};

const app = createApp({
  authRouter: createAuthRouter({
    auth,
    authService,
    authMiddleware,
    onLogout: (userId) => disconnectUserSockets(userId),
  }),
  boardsRouter: createBoardsRouter({ boardsService, authMiddleware }),
});

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

const io = new Server(server as HttpServer, {
  cors: {
    origin: "*",
  },
});

disconnectUserSockets = createSocketServer(io, {
  presence,
  collaboration,
  resolveAccessToken,
}).disconnectUserSockets;
