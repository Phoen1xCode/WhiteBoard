import { Hono } from "hono";
import { loginBodySchema, refreshBodySchema, registerBodySchema } from "@whiteboard/shared/schemas";
import { z } from "zod";

import * as auth from "@/auth";
import { disconnectUserSockets } from "@/collaboration";
import { ok } from "@/lib/api-envelope";
import { authMiddleware } from "@/middleware/auth";
import { getClientIp, rateLimit } from "@/middleware/rate-limit";
import { validateBody } from "@/middleware/validate";

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

export function createAuthRouter(): Hono {
  const router = new Hono().basePath("/api/v1/auth");

  router.post("/register", registerRateLimit, validateBody(registerBodySchema), async (c) => {
    const result = await auth.register(c.req.valid("json"));
    return c.json(ok(result), 201);
  });

  router.post("/login", loginRateLimit, validateBody(loginBodySchema), async (c) => {
    return c.json(ok(await auth.login(c.req.valid("json"))));
  });

  router.post("/refresh", validateBody(refreshBodySchema), async (c) => {
    const { refreshToken } = c.req.valid("json");
    return c.json(ok(await auth.refresh(refreshToken)));
  });

  router.post("/logout", authMiddleware, validateBody(logoutBodySchema), async (c) => {
    const user = c.get("user");
    try {
      await auth.logout(c.get("accessToken"));
    } finally {
      disconnectUserSockets(user.id);
    }
    return c.json(ok({ loggedOut: true }));
  });

  router.get("/me", authMiddleware, async (c) => {
    return c.json(ok({ user: await auth.getMe(c.get("user").id) }));
  });

  return router;
}
