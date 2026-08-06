import type { AuthenticatedUser, JwtTokenPayload } from "@/types/auth";

import "hono";

/** Set by authMiddleware / validateBody on every route that uses them. */
declare module "hono" {
  interface ContextVariableMap {
    user: AuthenticatedUser;
    jwtPayload: JwtTokenPayload;
    accessToken: string;
    body: unknown;
  }
}
