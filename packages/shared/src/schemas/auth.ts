import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.email(),
  username: z.string().min(4).max(15),
  password: z.string().min(6).max(24),
});

export type RegisterInput = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(24),
});

export type LoginInput = z.infer<typeof loginBodySchema>;

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshInput = z.infer<typeof refreshBodySchema>;

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type LogoutInput = z.infer<typeof logoutBodySchema>;

/** Identity on a token / request. JWT claims do not include timestamps. */
export const authenticatedUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  username: z.string(),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

export const userResponseSchema = authenticatedUserSchema.extend({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const tokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type TokenPair = z.infer<typeof tokenPairSchema>;

export const authResultSchema = z.object({
  user: userResponseSchema,
  tokens: tokenPairSchema,
});

export type AuthResult = z.infer<typeof authResultSchema>;

export const meResponseSchema = z.object({
  user: userResponseSchema,
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const logoutResultSchema = z.object({
  loggedOut: z.literal(true),
});

export type LogoutResult = z.infer<typeof logoutResultSchema>;
