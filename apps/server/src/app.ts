import type { MiddlewareHandler } from "hono";

import type { BetterAuth } from "@/lib/better-auth";
import type { AuthMiddleware } from "@/middlewares/auth";
import type { AuthService } from "@/services/auth.service";
import type { BoardsService } from "@/services/boards.service";

import { configureOpenAPI } from "@/lib/configure-open-api";
import { createBaseApp } from "@/lib/create-app";
import { createAuthRouter } from "@/routes/auth/auth.index";
import { createBoardsRouter } from "@/routes/boards/boards.index";
import { createIndexRouter } from "@/routes/index.route";

export interface AppDeps {
  auth: BetterAuth;
  authService: AuthService;
  authMiddleware: AuthMiddleware;
  boardsService: BoardsService;
  logger?: MiddlewareHandler;
  onLogout: (userId: string) => void;
}

export function createApp({
  auth,
  authService,
  authMiddleware,
  boardsService,
  logger,
  onLogout,
}: AppDeps) {
  const app = createBaseApp({ logger });

  configureOpenAPI(app);

  return app
    .route("/", createIndexRouter())
    .route("/", createAuthRouter({ auth, authService, authMiddleware, onLogout }))
    .route("/", createBoardsRouter({ boardsService, authMiddleware }));
}

export type AppType = ReturnType<typeof createApp>;
