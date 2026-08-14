import type { Schema } from "hono";
import type { MiddlewareHandler } from "hono";

import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";

import type { AppBindings, AppOpenAPI } from "@/lib/types";

import { errorBody, errorHandler } from "@/shared/http/error-handler";
import { formatValidationMessage } from "@/shared/http/validate";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(errorBody("VALIDATION_ERROR", formatValidationMessage(result.error)), 400);
      }
    },
  });
}

export function createBaseApp(options: { logger?: MiddlewareHandler } = {}) {
  const app = createRouter();

  app.use(requestId());
  app.use(cors());
  if (options.logger) app.use(options.logger);

  app.onError(errorHandler);
  app.notFound((c) => c.json(errorBody("NOT_FOUND", "Not Found"), 404));

  return app;
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createBaseApp().route("/", router);
}
