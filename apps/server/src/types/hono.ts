import type { AuthenticatedUser } from "@/types/auth";

import "hono";

/** Set by authMiddleware on routes that use it. */
declare module "hono" {
  interface ContextVariableMap {
    user: AuthenticatedUser;
    accessToken: string;
  }
}
