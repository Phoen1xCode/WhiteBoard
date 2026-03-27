import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenTtlSeconds,
} from "../lib/jwt";
import { getRedis } from "../lib/redis";
import * as userRepo from "../repositories/user.repository";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function register(
  email: string,
  username: string,
  password: string,
) {
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) throw new AuthError("Email already registered", 409);

  const existingUsername = await userRepo.findByUsername(username);
  if (existingUsername) throw new AuthError("Username already taken", 409);

  const hash = await Bun.password.hash(password, {
    algorithm: "argon2id",
  });

  const user = await userRepo.create({
    email: email,
    username: username,
    password: hash,
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    }),
    signRefreshToken(user.id),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    accessToken,
    refreshToken,
  };
}

export async function login(email: string, password: string) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AuthError("Invalid credentials", 401);

  const isValid = await Bun.password.verify(password, user.password);
  if (!isValid) throw new AuthError("Invalid credentials", 401);

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    }),
    signRefreshToken(user.id),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(refreshTokenString: string) {
  const payload = await verifyRefreshToken(refreshTokenString);
  const user = await userRepo.findById(payload.userId);

  if (!user) throw new AuthError("User not found", 401);

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    }),
    signRefreshToken(user.id),
  ]);

  return { accessToken, refreshToken };
}

export async function logout(jti: string) {
  const redis = getRedis();
  const ttl = getAccessTokenTtlSeconds();
  await redis.set(`jwt:blacklist:${jti}`, "1", "EX", ttl); // ioredis supports SET ... EX natively
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.get(`jwt:blacklist:${jti}`);
  return result !== null;
}

export async function getMe(userId: number) {
  const user = await userRepo.findById(userId);
  if (!user) throw new AuthError("User not found", 404);
  return { id: user.id, email: user.email, username: user.username };
}
