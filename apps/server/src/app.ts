import type { MiddlewareHandler } from "hono";

import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";

import type { AppOpenAPI } from "@/lib/hono";

import { errorBody, errorHandler } from "@/lib/errors";
import { createRouter } from "@/lib/hono";
import { createAuthRoutes } from "@/routes/auth";
import { boardsRoutes } from "@/routes/boards";
import { indexRoutes } from "@/routes/index";

import packageJson from "../package.json" with { type: "json" };

interface AppOptions {
  logger?: MiddlewareHandler;
  onLogout?: (userId: string) => void;
}

function configureOpenAPI(app: AppOpenAPI): void {
  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
  });

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      title: "WhiteBoard API",
      version: packageJson.version,
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      theme: "kepler",
      layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
    }),
  );
}

export function createApp(options: AppOptions = {}) {
  const app = createRouter();

  app.use(requestId());
  app.use(cors());
  if (options.logger) app.use(options.logger);

  app.onError(errorHandler);
  app.notFound((c) => c.json(errorBody("NOT_FOUND", "Not Found"), 404));
  configureOpenAPI(app);

  return app
    .route("/", indexRoutes)
    .route("/", createAuthRoutes(options.onLogout))
    .route("/", boardsRoutes);
}

export type AppType = ReturnType<typeof createApp>;
