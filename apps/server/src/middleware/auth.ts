import type { Middleware } from "koa";

import { AppError } from "@/lib/app-error";
import { resolveAccessToken } from "@/resolve-access-token";

function extractBearer(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export const authMiddleware: Middleware = async (ctx, next) => {
  const token = extractBearer(ctx.get("authorization"));
  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const resolved = await resolveAccessToken(token);
  ctx.state.accessToken = resolved.token;
  ctx.state.jwtPayload = resolved.payload;
  ctx.state.user = resolved.user;
  await next();
};
