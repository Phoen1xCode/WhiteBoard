import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/lib/hono";

import { resolveAccessToken } from "@/lib/auth";
import { errorBody } from "@/lib/errors";

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  const authorization = c.req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return c.json(errorBody("UNAUTHORIZED", "Unauthorized"), 401);
  }

  const resolved = await resolveAccessToken(token);
  c.set("accessToken", resolved.token);
  c.set("user", resolved.user);
  await next();
});
