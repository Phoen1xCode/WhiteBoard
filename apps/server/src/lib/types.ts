import type { RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Schema } from "hono";
import type { PinoLogger } from "hono-pino";

import type { AuthenticatedUser } from "@/types/auth";

export interface AppBindings {
  Variables: {
    accessToken: string;
    logger: PinoLogger;
    user: AuthenticatedUser;
  };
}

export type AppOpenAPI<S extends Schema = Record<never, never>> =
  import("@hono/zod-openapi").OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
