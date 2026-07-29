import type { Context } from "koa";

import Router from "@koa/router";
import { loginBodySchema, refreshBodySchema, registerBodySchema } from "@whiteboard/shared/schemas";
import { z } from "zod";

import * as auth from "@/auth";
import { disconnectUserSockets } from "@/collaboration";
import { AppError } from "@/lib/app-error";
import { success } from "@/lib/response";
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

function body<T>(ctx: Context): T {
  return (ctx.request as typeof ctx.request & { body: T }).body;
}

export function createAuthRouter(): Router {
  const router = new Router({ prefix: "/api/v1/auth" });

  router.post("/register", registerRateLimit, validateBody(registerBodySchema), async (ctx) => {
    const result = await auth.register(body(ctx));
    ctx.status = 201;
    ctx.body = success(result);
  });

  router.post("/login", loginRateLimit, validateBody(loginBodySchema), async (ctx) => {
    ctx.body = success(await auth.login(body(ctx)));
  });

  router.post("/refresh", validateBody(refreshBodySchema), async (ctx) => {
    const { refreshToken } = body<{ refreshToken: string }>(ctx);
    ctx.body = success(await auth.refresh(refreshToken));
  });

  router.post("/logout", authMiddleware, validateBody(logoutBodySchema), async (ctx) => {
    const payload = ctx.state.jwtPayload;
    if (!payload) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    const { refreshToken } = body<{ refreshToken?: string }>(ctx);
    try {
      await auth.logout(payload, refreshToken);
    } finally {
      disconnectUserSockets(payload.sub);
    }
    ctx.body = success({ loggedOut: true });
  });

  router.get("/me", authMiddleware, async (ctx) => {
    const payload = ctx.state.jwtPayload;
    if (!payload) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    ctx.body = success({ user: await auth.getMe(payload.sub) });
  });

  return router;
}
