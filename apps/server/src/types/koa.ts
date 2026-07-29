import type { AuthenticatedUser, JwtTokenPayload } from "@/types/auth";

import "koa";

declare module "koa" {
  interface DefaultState {
    user?: AuthenticatedUser;
    jwtPayload?: JwtTokenPayload;
    accessToken?: string;
  }
}
