import { createMiddleware } from "hono/factory";

import type { ResolveAccessToken } from "@/lib/token";
import type { AuthenticatedUser } from "@/types/auth";

import { errorBody } from "@/shared/http/error-handler";

declare module "hono" {
  interface ContextVariableMap {
    /** Set by the auth middleware on routes that use it. */
    user: AuthenticatedUser;
    accessToken: string;
  }
}

export function createAuthMiddleware(resolveAccessToken: ResolveAccessToken) {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

    if (!token) {
      return c.json(errorBody("UNAUTHORIZED", "Unauthorized"), 401);
    }

    const resolved = await resolveAccessToken(token);
    c.set("accessToken", resolved.token);
    c.set("user", resolved.user);
    await next();
  });
}

export type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;
