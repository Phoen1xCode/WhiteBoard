import { createRoute } from "@hono/zod-openapi";
import { loginBodySchema, refreshBodySchema, registerBodySchema } from "@whiteboard/shared/schemas";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createRouter } from "@/lib/hono";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/middleware/auth";
import { bearerSecurity, errorSchema, jsonContent, jsonContentRequired } from "@/routes/openapi";
import { authService } from "@/services/auth";

const tags = ["Auth"];

const safeUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  username: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const authResultSchema = z.object({
  user: safeUserSchema,
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

const logoutBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

const registerRoute = createRoute({
  method: "post",
  path: "/api/v1/auth/register",
  tags,
  request: {
    body: jsonContentRequired(registerBodySchema, "Registration credentials"),
  },
  responses: {
    201: jsonContent(authResultSchema, "Registered user and session"),
    400: jsonContent(errorSchema, "Validation error"),
    409: jsonContent(errorSchema, "Email or username already exists"),
    429: jsonContent(errorSchema, "Rate limited"),
    500: jsonContent(errorSchema, "Internal server error"),
  },
});

const loginRoute = createRoute({
  method: "post",
  path: "/api/v1/auth/login",
  tags,
  request: {
    body: jsonContentRequired(loginBodySchema, "Login credentials"),
  },
  responses: {
    200: jsonContent(authResultSchema, "Authenticated user and session"),
    400: jsonContent(errorSchema, "Validation error"),
    401: jsonContent(errorSchema, "Invalid credentials"),
    429: jsonContent(errorSchema, "Rate limited"),
  },
});

const refreshRoute = createRoute({
  method: "post",
  path: "/api/v1/auth/refresh",
  tags,
  request: {
    body: jsonContentRequired(refreshBodySchema, "Current session token"),
  },
  responses: {
    200: jsonContent(authResultSchema, "Current user and session"),
    400: jsonContent(errorSchema, "Validation error"),
    401: jsonContent(errorSchema, "Invalid session"),
  },
});

const logoutRoute = createRoute({
  method: "post",
  path: "/api/v1/auth/logout",
  tags,
  security: bearerSecurity,
  request: {
    body: jsonContentRequired(logoutBodySchema, "Optional legacy refresh token"),
  },
  responses: {
    200: jsonContent(z.object({ loggedOut: z.literal(true) }), "Session revoked"),
    400: jsonContent(errorSchema, "Validation error"),
    401: jsonContent(errorSchema, "Unauthorized"),
  },
});

const meRoute = createRoute({
  method: "get",
  path: "/api/v1/auth/me",
  tags,
  security: bearerSecurity,
  responses: {
    200: jsonContent(z.object({ user: safeUserSchema }), "Current user"),
    401: jsonContent(errorSchema, "Unauthorized"),
  },
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

export function createAuthRoutes(onLogout: (userId: string) => void = () => {}) {
  const router = createRouter();

  router.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  router.use(registerRoute.getRoutingPath(), registerRateLimit);
  router.use(loginRoute.getRoutingPath(), loginRateLimit);
  router.use(logoutRoute.getRoutingPath(), requireAuth);
  router.use(meRoute.getRoutingPath(), requireAuth);

  return router
    .openapi(registerRoute, async (c) => {
      return c.json(await authService.register(c.req.valid("json")), 201);
    })
    .openapi(loginRoute, async (c) => {
      return c.json(await authService.login(c.req.valid("json")), 200);
    })
    .openapi(refreshRoute, async (c) => {
      return c.json(await authService.refresh(c.req.valid("json").refreshToken), 200);
    })
    .openapi(logoutRoute, async (c) => {
      const user = c.get("user");
      try {
        await authService.logout(c.get("accessToken"));
      } finally {
        onLogout(user.id);
      }
      return c.json({ loggedOut: true }, 200);
    })
    .openapi(meRoute, async (c) => {
      return c.json({ user: await authService.getMe(c.get("user").id) }, 200);
    });
}
