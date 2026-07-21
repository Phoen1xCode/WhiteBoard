import bcrypt from "bcryptjs";
import type { User } from "../../prisma/generated/client";
import { AppError } from "../lib/app-error";
import { signTokenPair, verifyRefreshToken } from "../lib/jwt";
import { blacklistToken, isTokenBlacklisted } from "../lib/token-blacklist";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
} from "../repositories/user-repository";
import type { AuthResult, JwtTokenPayload, SafeUser, TokenPair } from "../types/auth";

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  accessTokenPayload: JwtTokenPayload;
  refreshToken?: string;
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

function createTokenPair(userId: string): TokenPair {
  return signTokenPair(userId);
}

function verifyRefreshTokenOrThrow(refreshToken: string): JwtTokenPayload {
  try {
    return verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid refresh token");
  }
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existingEmailUser = await findUserByEmail(input.email);

  if (existingEmailUser) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
  }

  const existingUsernameUser = await findUserByUsername(input.username);

  if (existingUsernameUser) {
    throw new AppError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUser({
    email: input.email,
    username: input.username,
    passwordHash,
  });

  return {
    user: toSafeUser(user),
    tokens: createTokenPair(user.id),
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  return {
    user: toSafeUser(user),
    tokens: createTokenPair(user.id),
  };
}

export async function refresh(input: RefreshInput): Promise<AuthResult> {
  const payload = verifyRefreshTokenOrThrow(input.refreshToken);
  const isBlacklisted = await isTokenBlacklisted(payload.jti);

  if (isBlacklisted) {
    throw new AppError(401, "UNAUTHORIZED", "Refresh token has been revoked");
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  await blacklistToken(payload.jti, payload.exp);

  return {
    user: toSafeUser(user),
    tokens: createTokenPair(user.id),
  };
}

export async function logout(input: LogoutInput): Promise<void> {
  await blacklistToken(input.accessTokenPayload.jti, input.accessTokenPayload.exp);

  if (!input.refreshToken) {
    return;
  }

  const refreshPayload = verifyRefreshTokenOrThrow(input.refreshToken);
  await blacklistToken(refreshPayload.jti, refreshPayload.exp);
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return toSafeUser(user);
}
