import type { PrismaClient, User } from "@prisma/generated/client";

import { APIError } from "better-auth/api";

import type { BetterAuth } from "@/lib/better-auth";
import type { AuthResult, SafeUser } from "@/types/auth";

import { ApiError } from "@/shared/api-error";

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

export function createAuthService({ prisma, auth }: { prisma: PrismaClient; auth: BetterAuth }) {
  async function register(input: RegisterInput): Promise<AuthResult> {
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

  async function login(input: LoginInput): Promise<AuthResult> {
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

  async function refresh(refreshToken: string): Promise<AuthResult> {
    const result = await auth.api.getSession({ headers: bearerHeaders(refreshToken) });
    if (!result) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid refresh token");
    }
    return toAuthResult(result.user, result.session.token);
  }

  /** Revokes the session server-side; caller should disconnect sockets. */
  async function logout(accessToken: string): Promise<void> {
    await auth.api.signOut({ headers: bearerHeaders(accessToken) });
  }

  async function getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
    }
    return toSafeUser(user);
  }

  return { register, login, refresh, logout, getMe };
}

export type AuthService = ReturnType<typeof createAuthService>;
