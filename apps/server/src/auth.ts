import { APIError } from "better-auth/api";

import type { AuthResult, SafeUser } from "@/types/auth";

import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import type { User } from "../prisma/generated/client";

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

function toSafeUser(user: User | BetterAuthUser): SafeUser {
  const username = "username" in user ? user.username : user.name;
  return {
    id: user.id,
    email: user.email,
    username,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Session token serves as both access and refresh token (sliding session). */
function toAuthResult(user: User | BetterAuthUser, token: string): AuthResult {
  return { user: toSafeUser(user), tokens: { accessToken: token, refreshToken: token } };
}

function bearerHeaders(token: string): Headers {
  return new Headers({ authorization: `Bearer ${token}` });
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
  }
  if (await prisma.user.findUnique({ where: { username: input.username } })) {
    throw new ApiError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
  }

  const { token, user } = await auth.api.signUpEmail({
    body: { email: input.email, password: input.password, name: input.username },
  });
  if (!token) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to create session", false);
  }

  return toAuthResult(user, token);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  try {
    const { token, user } = await auth.api.signInEmail({
      body: { email: input.email, password: input.password },
    });
    return toAuthResult(user, token);
  } catch (error) {
    if (error instanceof APIError) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    throw error;
  }
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  const result = await auth.api.getSession({ headers: bearerHeaders(refreshToken) });
  if (!result) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid refresh token");
  }
  return toAuthResult(result.user, result.session.token);
}

/** Revokes the session server-side; caller should disconnect sockets. */
export async function logout(accessToken: string): Promise<void> {
  await auth.api.signOut({ headers: bearerHeaders(accessToken) });
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return toSafeUser(user);
}
