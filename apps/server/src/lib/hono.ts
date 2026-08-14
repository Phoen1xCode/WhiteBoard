import type { Schema } from "hono";

import { OpenAPIHono } from "@hono/zod-openapi";

import type { AuthenticatedUser } from "@/lib/auth";

import { errorBody, formatValidationMessage } from "@/lib/errors";

export interface AppBindings {
  Variables: {
    accessToken: string;
    user: AuthenticatedUser;
  };
}

export type AppOpenAPI<S extends Schema = Record<never, never>> = OpenAPIHono<AppBindings, S>;

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
