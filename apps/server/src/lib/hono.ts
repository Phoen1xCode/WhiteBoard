import type { AuthenticatedUser } from "@whiteboard/shared/schemas";

import { Hono } from "hono";

export interface AppBindings {
  Variables: {
    accessToken: string;
    user: AuthenticatedUser;
  };
}

export function createRouter() {
  return new Hono<AppBindings>({ strict: false });
}
