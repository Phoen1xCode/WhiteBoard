import type { MiddlewareHandler } from "hono";

import { ApiError } from "@/lib/api-error";
import { resolveAccessToken } from "@/resolve-access-token";

function extractBearer(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = extractBearer(c.req.header("authorization"));
  if (!token) {
    throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const resolved = await resolveAccessToken(token);
  c.set("accessToken", resolved.token);
  c.set("jwtPayload", resolved.payload);
  c.set("user", resolved.user);
  await next();
};
