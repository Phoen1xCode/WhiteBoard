import type { MiddlewareHandler } from "hono";

import { cors } from "hono/cors";
import { requestId } from "hono/request-id";

import { errorBody, errorHandler } from "@/lib/errors";
import { createRouter } from "@/lib/hono";
import { createAuthRoutes } from "@/routes/auth";
import { boardsRoutes } from "@/routes/boards";
import { indexRoutes } from "@/routes/index";

interface AppOptions {
  logger?: MiddlewareHandler;
  onLogout?: (userId: string) => void;
}

export function createApp(options: AppOptions = {}) {
  const app = createRouter();

  app.use(requestId());
  app.use(cors());
  if (options.logger) app.use(options.logger);

  app.onError(errorHandler);
  app.notFound((c) => c.json(errorBody("NOT_FOUND", "Not Found"), 404));

  return app
    .route("/", indexRoutes)
    .route("/", createAuthRoutes(options.onLogout))
    .route("/", boardsRoutes);
}

export type AppType = ReturnType<typeof createApp>;
