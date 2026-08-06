import type { Context } from "hono";

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

function body<T>(c: Context): T {
  return c.get("body") as T;
}

export function createAuthRouter(): Hono {
  const router = new Hono().basePath("/api/v1/auth");

  router.post("/register", registerRateLimit, validateBody(registerBodySchema), async (c) => {
    const result = await auth.register(body(c));
    return c.json(ok(result), 201);
  });

  router.post("/login", loginRateLimit, validateBody(loginBodySchema), async (c) => {
    return c.json(ok(await auth.login(body(c))));
  });

  router.post("/refresh", validateBody(refreshBodySchema), async (c) => {
    const { refreshToken } = body<{ refreshToken: string }>(c);
    return c.json(ok(await auth.refresh(refreshToken)));
  });

  router.post("/logout", authMiddleware, validateBody(logoutBodySchema), async (c) => {
    const payload = c.get("jwtPayload");
    const { refreshToken } = body<{ refreshToken?: string }>(c);
    try {
      await auth.logout(payload, refreshToken);
    } finally {
      disconnectUserSockets(payload.sub);
    }
    return c.json(ok({ loggedOut: true }));
  });

  router.get("/me", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload");
    return c.json(ok({ user: await auth.getMe(payload.sub) }));
  });

  return router;
}
