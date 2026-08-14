import { createRoute } from "@hono/zod-openapi";
import { loginBodySchema, refreshBodySchema, registerBodySchema } from "@whiteboard/shared/schemas";
import { z } from "zod";

import { bearerSecurity, errorSchema, jsonContent, jsonContentRequired } from "@/lib/open-api";

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

export const register = createRoute({
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

export const login = createRoute({
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

export const refresh = createRoute({
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

export const logout = createRoute({
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

export const me = createRoute({
  method: "get",
  path: "/api/v1/auth/me",
  tags,
  security: bearerSecurity,
  responses: {
    200: jsonContent(z.object({ user: safeUserSchema }), "Current user"),
    401: jsonContent(errorSchema, "Unauthorized"),
  },
});

export type RegisterRoute = typeof register;
export type LoginRoute = typeof login;
export type RefreshRoute = typeof refresh;
export type LogoutRoute = typeof logout;
export type MeRoute = typeof me;
