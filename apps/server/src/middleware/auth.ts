import { createMiddleware } from "hono/factory";

import { resolveAccessToken } from "@/resolve-access-token";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return c.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      401,
    );
  }

  const resolved = await resolveAccessToken(token);
  c.set("accessToken", resolved.token);
  c.set("user", resolved.user);
  await next();
});
