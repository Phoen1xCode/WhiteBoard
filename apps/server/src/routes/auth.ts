import { zValidator } from "@hono/zod-validator";
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from "@whiteboard/shared/schemas";

import { auth } from "@/lib/auth";
import { validationError } from "@/lib/errors";
import { createRouter } from "@/lib/hono";
import { requireAuth } from "@/middleware/auth";
import { betterAuthRateLimit } from "@/middleware/better-auth-rate-limit";
import { authService } from "@/services/auth";

export function createAuthRoutes(onLogout: (userId: string) => void = () => {}) {
  const router = createRouter();

  router.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  router.use("/api/v1/auth/register", betterAuthRateLimit);
  router.use("/api/v1/auth/login", betterAuthRateLimit);
  router.use("/api/v1/auth/logout", requireAuth);
  router.use("/api/v1/auth/me", requireAuth);

  return router
    .post(
      "/api/v1/auth/register",
      zValidator("json", registerBodySchema, (result, c) => {
        if (!result.success) return validationError(c, result.error);
      }),
      async (c) => {
        return c.json(await authService.register(c.req.valid("json")), 201);
      },
    )
    .post(
      "/api/v1/auth/login",
      zValidator("json", loginBodySchema, (result, c) => {
        if (!result.success) return validationError(c, result.error);
      }),
      async (c) => {
        return c.json(await authService.login(c.req.valid("json")), 200);
      },
    )
    .post(
      "/api/v1/auth/refresh",
      zValidator("json", refreshBodySchema, (result, c) => {
        if (!result.success) return validationError(c, result.error);
      }),
      async (c) => {
        return c.json(await authService.refresh(c.req.valid("json").refreshToken), 200);
      },
    )
    .post(
      "/api/v1/auth/logout",
      zValidator("json", logoutBodySchema, (result, c) => {
        if (!result.success) return validationError(c, result.error);
      }),
      async (c) => {
        const user = c.get("user");
        try {
          await authService.logout(c.get("accessToken"), c.req.valid("json").refreshToken);
        } finally {
          onLogout(user.id);
        }
        return c.json({ loggedOut: true }, 200);
      },
    )
    .get("/api/v1/auth/me", async (c) => {
      return c.json({ user: await authService.getMe(c.get("user").id) }, 200);
    });
}
