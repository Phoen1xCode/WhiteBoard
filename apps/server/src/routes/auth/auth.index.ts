import type { BetterAuth } from "@/lib/better-auth";
import type { AuthMiddleware } from "@/middlewares/auth";
import type { AuthService } from "@/services/auth.service";

import { createRouter } from "@/lib/create-app";
import { getClientIp, rateLimit } from "@/shared/rate-limit";

import { createAuthHandlers } from "./auth.handlers";
import * as routes from "./auth.routes";

const registerRateLimit = rateLimit({
  keyPrefix: "rate:ip:register",
  limit: 5,
  windowMs: 60_000,
  keyGenerator: getClientIp,
});

const loginRateLimit = rateLimit({
  keyPrefix: "rate:ip:login",
  limit: 10,
  windowMs: 60_000,
  keyGenerator: getClientIp,
});

export interface AuthRouterDeps {
  auth: BetterAuth;
  authService: AuthService;
  authMiddleware: AuthMiddleware;
  onLogout: (userId: string) => void;
}

export function createAuthRouter({ auth, authService, authMiddleware, onLogout }: AuthRouterDeps) {
  const router = createRouter();
  const handlers = createAuthHandlers({ authService, onLogout });

  router.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  router.use(routes.register.getRoutingPath(), registerRateLimit);
  router.use(routes.login.getRoutingPath(), loginRateLimit);
  router.use(routes.logout.getRoutingPath(), authMiddleware);
  router.use(routes.me.getRoutingPath(), authMiddleware);

  return router
    .openapi(routes.register, handlers.register)
    .openapi(routes.login, handlers.login)
    .openapi(routes.refresh, handlers.refresh)
    .openapi(routes.logout, handlers.logout)
    .openapi(routes.me, handlers.me);
}
