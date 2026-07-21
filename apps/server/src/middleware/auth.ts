import type { Middleware } from "koa";

import koaJwt from "koa-jwt";

import type { AuthenticatedUser, JwtTokenPayload } from "../types/auth";

import { AppError } from "../lib/app-error";
import { isTokenBlacklisted } from "../lib/token-blacklist";
import { findUserById } from "../repositories/user-repository";

import "dotenv/config";

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }

  return secret;
}

function isJwtTokenPayload(payload: unknown): payload is JwtTokenPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<JwtTokenPayload>;

  return (
    typeof candidate.sub === "string" &&
    typeof candidate.jti === "string" &&
    candidate.type === "access"
  );
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  username: string;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

let jwtMiddleware: Middleware | null = null;

function getJwtMiddleware(): Middleware {
  if (!jwtMiddleware) {
    jwtMiddleware = koaJwt({
      secret: getAccessSecret(),
      key: "jwtPayload",
      tokenKey: "accessToken",
      isRevoked: async (_ctx, decodedToken) => {
        if (!isJwtTokenPayload(decodedToken)) {
          return true;
        }

        return await isTokenBlacklisted(decodedToken.jti);
      },
    });
  }

  return jwtMiddleware;
}

export const authMiddleware: Middleware = async (ctx, next) => {
  await getJwtMiddleware()(ctx, async () => {
    const payload = ctx.state.jwtPayload;

    if (!isJwtTokenPayload(payload)) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const user = await findUserById(payload.sub);

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    ctx.state.user = toAuthenticatedUser(user);
    await next();
  });
};
