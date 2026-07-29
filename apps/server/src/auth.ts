import bcrypt from "bcryptjs";

import type { AuthResult, JwtTokenPayload, SafeUser } from "@/types/auth";

import { AppError } from "@/lib/app-error";
import { signTokenPair, verifyRefreshToken } from "@/lib/jwt";
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

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
  }
  if (await prisma.user.findUnique({ where: { username: input.username } })) {
    throw new AppError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash: await bcrypt.hash(input.password, 12),
    },
  });

  return { user: toSafeUser(user), tokens: signTokenPair(user.id) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  return { user: toSafeUser(user), tokens: signTokenPair(user.id) };
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  let payload: JwtTokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return { user: toSafeUser(user), tokens: signTokenPair(user.id) };
}

/** Tokens stay valid until expiry; caller should disconnect sockets. */
export async function logout(
  _accessTokenPayload: JwtTokenPayload,
  _refreshToken?: string,
): Promise<void> {
  // no server-side revocation store
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return toSafeUser(user);
}
