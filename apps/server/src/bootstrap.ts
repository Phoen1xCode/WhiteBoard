import type { Server } from "socket.io";

import type { ServerConfig } from "@/config";

import { createApp } from "@/app";
import { createBetterAuth } from "@/lib/better-auth";
import { createTokenResolver } from "@/lib/token";
import { createAuthMiddleware } from "@/middlewares/auth";
import { createPinoLogger } from "@/middlewares/pino-logger";
import { createAuthService } from "@/services/auth.service";
import { createBoardAccess } from "@/services/board-access";
import { createBoardsService } from "@/services/boards.service";
import { createCollaboration } from "@/services/collaboration";
import { createOperationsService } from "@/services/operations.service";
import { createPresence } from "@/services/presence";
import { createPrismaClient } from "@/shared/prisma";
import { createSocketServer } from "@/sockets/socket";

export function bootstrap(config: ServerConfig) {
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

  let disconnectUserSockets: (userId: string) => void = () => {};

  const app = createApp({
    auth,
    authService,
    authMiddleware,
    boardsService,
    logger: createPinoLogger(config),
    onLogout: (userId) => disconnectUserSockets(userId),
  });

  return {
    app,
    attachSocketServer(io: Server) {
      disconnectUserSockets = createSocketServer(io, {
        presence,
        collaboration,
        resolveAccessToken,
      }).disconnectUserSockets;
    },
  };
}
