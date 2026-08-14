import type { User } from "@generated/client";

import { APIError } from "better-auth/api";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";

interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

interface LoginInput {
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

interface SafeUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResult {
  user: SafeUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

function toSafeUser(user: User | BetterAuthUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: "username" in user ? user.username : user.name,
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

async function register(input: RegisterInput): Promise<AuthResult> {
  if (await db.user.findUnique({ where: { email: input.email } })) {
    throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
  }
  if (await db.user.findUnique({ where: { username: input.username } })) {
    throw new HttpError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
  }

  const { token, user } = await auth.api.signUpEmail({
    body: { email: input.email, password: input.password, name: input.username },
  });
  if (!token) {
    throw new HttpError(500, "INTERNAL_SERVER_ERROR", "Failed to create session");
  }

  return toAuthResult(user, token);
}

async function login(input: LoginInput): Promise<AuthResult> {
  try {
    const { token, user } = await auth.api.signInEmail({
      body: { email: input.email, password: input.password },
    });
    return toAuthResult(user, token);
  } catch (error) {
    if (error instanceof APIError) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    throw error;
  }
}

async function refresh(refreshToken: string): Promise<AuthResult> {
  const result = await auth.api.getSession({ headers: bearerHeaders(refreshToken) });
  if (!result) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid refresh token");
  }
  return toAuthResult(result.user, result.session.token);
}

async function logout(accessToken: string): Promise<void> {
  await auth.api.signOut({ headers: bearerHeaders(accessToken) });
}

async function getMe(userId: string): Promise<SafeUser> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return toSafeUser(user);
}

export const authService = { register, login, refresh, logout, getMe };
