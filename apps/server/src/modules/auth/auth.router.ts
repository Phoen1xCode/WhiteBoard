import { loginBodySchema, refreshBodySchema, registerBodySchema } from "@whiteboard/shared/schemas";
import { Hono } from "hono";
import { z } from "zod";

import type { AuthMiddleware } from "@/modules/auth/auth.middleware";
import type { AuthService } from "@/modules/auth/auth.service";
import type { BetterAuth } from "@/modules/auth/better-auth";

import { validateBody } from "@/shared/http/validate";
import { getClientIp, rateLimit } from "@/shared/rate-limit";

const logoutBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

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
  /** Called after session revocation so realtime can drop the user's sockets. */
  onLogout: (userId: string) => void;
}

export function createAuthRouter({
  auth,
  authService,
  authMiddleware,
  onLogout,
}: AuthRouterDeps): Hono {
  const router = new Hono();

  // Better Auth's own endpoints, mounted alongside the facade below.
  router.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  router.post(
    "/api/v1/auth/register",
    registerRateLimit,
    validateBody(registerBodySchema),
    async (c) => {
      const result = await authService.register(c.req.valid("json"));
      return c.json(result, 201);
    },
  );

  router.post("/api/v1/auth/login", loginRateLimit, validateBody(loginBodySchema), async (c) => {
    return c.json(await authService.login(c.req.valid("json")));
  });

  router.post("/api/v1/auth/refresh", validateBody(refreshBodySchema), async (c) => {
    const { refreshToken } = c.req.valid("json");
    return c.json(await authService.refresh(refreshToken));
  });

  router.post("/api/v1/auth/logout", authMiddleware, validateBody(logoutBodySchema), async (c) => {
    const user = c.get("user");
    try {
      await authService.logout(c.get("accessToken"));
    } finally {
      onLogout(user.id);
    }
    return c.json({ loggedOut: true });
  });

  router.get("/api/v1/auth/me", authMiddleware, async (c) => {
    return c.json({ user: await authService.getMe(c.get("user").id) });
  });

  return router;
}
