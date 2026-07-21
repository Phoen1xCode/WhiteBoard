import Router from "@koa/router";
import { z } from "zod";
import * as authController from "../controllers/auth-controller";
import { authMiddleware } from "../middleware/auth";
import { getClientIp, rateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";

const registerBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

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
