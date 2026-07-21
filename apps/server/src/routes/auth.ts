import Router from "@koa/router";
import { z } from "zod";
import {
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from "@whiteboard/shared/schemas";
import * as authController from "../controllers/auth-controller";
import { authMiddleware } from "../middleware/auth";
import { getClientIp, rateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";

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

export function createAuthRouter(): Router {
  const router = new Router({ prefix: "/api/v1/auth" });

  router.post(
    "/register",
    registerRateLimit,
    validateBody(registerBodySchema),
    authController.register,
  );
  router.post(
    "/login",
    loginRateLimit,
    validateBody(loginBodySchema),
    authController.login,
  );
  router.post(
    "/refresh",
    validateBody(refreshBodySchema),
    authController.refresh,
  );
  router.post(
    "/logout",
    authMiddleware,
    validateBody(logoutBodySchema),
    authController.logout,
  );
  router.get("/me", authMiddleware, authController.me);

  return router;
}
