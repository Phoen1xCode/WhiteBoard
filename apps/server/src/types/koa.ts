import type { AuthenticatedUser, JwtTokenPayload } from "./auth";

import "koa";

declare module "koa" {
  interface DefaultState {
    user?: AuthenticatedUser;
    jwtPayload?: JwtTokenPayload;
    accessToken?: string;
  }
}
