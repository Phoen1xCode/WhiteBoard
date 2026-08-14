import { createRoute } from "@hono/zod-openapi";
import {
  authResultSchema,
  loginBodySchema,
  logoutBodySchema,
  logoutResultSchema,
  refreshBodySchema,
  registerBodySchema,
  userResponseSchema,
} from "@whiteboard/shared/schemas";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createRouter } from "@/lib/hono";
import { requireAuth } from "@/middleware/auth";
import { betterAuthRateLimit } from "@/middleware/better-auth-rate-limit";
import { bearerSecurity, errorSchema, jsonContent, jsonContentRequired } from "@/routes/openapi";
import { authService } from "@/services/auth";

const tags = ["Auth"];

const registerRoute = createRoute({
  method: "post",
  path: "/api/v1/auth/register",
  tags,
  request: {
    body: jsonContentRequired(registerBodySchema, "Registration credentials"),
  },
  responses: {
    201: jsonContent(authResultSchema, "Registered user, JWT, and session"),
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
    200: jsonContent(authResultSchema, "Authenticated user, JWT, and session"),
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
    body: jsonContentRequired(refreshBodySchema, "Session refresh token"),
  },
  responses: {
    200: jsonContent(authResultSchema, "Current user, new JWT, and session"),
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
    body: jsonContentRequired(logoutBodySchema, "Optional session refresh token"),
  },
  responses: {
    200: jsonContent(logoutResultSchema, "Session revoked"),
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
    200: jsonContent(z.object({ user: userResponseSchema }), "Current user"),
    401: jsonContent(errorSchema, "Unauthorized"),
  },
});

export function createAuthRoutes(onLogout: (userId: string) => void = () => {}) {
  const router = createRouter();

  router.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  router.use(registerRoute.getRoutingPath(), betterAuthRateLimit);
  router.use(loginRoute.getRoutingPath(), betterAuthRateLimit);
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
        await authService.logout(c.get("accessToken"), c.req.valid("json").refreshToken);
      } finally {
        onLogout(user.id);
      }
      return c.json({ loggedOut: true }, 200);
    })
    .openapi(meRoute, async (c) => {
      return c.json({ user: await authService.getMe(c.get("user").id) }, 200);
    });
}
