import "koa";
import type { AuthenticatedUser, JwtTokenPayload } from "./auth";

declare module "koa" {
  interface DefaultState {
    user?: AuthenticatedUser;
    jwtPayload?: JwtTokenPayload;
    accessToken?: string;
  }
}
