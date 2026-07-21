import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import type { JwtTokenPayload, TokenPair, TokenType } from "../types/auth";

import "dotenv/config";

export interface SignTokenInput {
  subject: string;
  jti: string;
  expiresIn?: SignOptions["expiresIn"];
}

function getSecret(tokenType: TokenType): string {
  const envName = tokenType === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET";
  const secret = process.env[envName];

  if (!secret) {
    throw new Error(`${envName} is not set`);
  }

  return secret;
}

function getExpiresIn(
  tokenType: TokenType,
  expiresIn?: SignOptions["expiresIn"],
): SignOptions["expiresIn"] {
  if (expiresIn) {
    return expiresIn;
  }

  if (tokenType === "access") {
    return (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as SignOptions["expiresIn"];
  }

  return (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
}

function signToken(tokenType: TokenType, input: SignTokenInput): string {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: getExpiresIn(tokenType, input.expiresIn),
    jwtid: input.jti,
    subject: input.subject,
  };

  return jwt.sign({ type: tokenType }, getSecret(tokenType), options);
}

function isJwtPayload(payload: string | JwtPayload): payload is JwtPayload {
  return typeof payload !== "string";
}

function verifyToken(token: string, expectedType: TokenType): JwtTokenPayload {
  const payload = jwt.verify(token, getSecret(expectedType), {
    algorithms: ["HS256"],
  });

  if (!isJwtPayload(payload)) {
    throw new Error("Invalid JWT payload");
  }

  if (payload.type !== expectedType) {
    throw new Error(`Expected ${expectedType} token`);
  }

  if (typeof payload.sub !== "string") {
    throw new Error("JWT subject is missing");
  }

  if (typeof payload.jti !== "string") {
    throw new Error("JWT JTI is missing");
  }

  return {
    sub: payload.sub,
    jti: payload.jti,
    type: expectedType,
    exp: payload.exp,
    iat: payload.iat,
  };
}

export function signAccessToken(input: SignTokenInput): string {
  return signToken("access", input);
}

export function signRefreshToken(input: SignTokenInput): string {
  return signToken("refresh", input);
}

export function verifyAccessToken(token: string): JwtTokenPayload {
  return verifyToken(token, "access");
}

export function verifyRefreshToken(token: string): JwtTokenPayload {
  return verifyToken(token, "refresh");
}

export function signTokenPair(subject: string): TokenPair {
  return {
    accessToken: signAccessToken({ subject, jti: crypto.randomUUID() }),
    refreshToken: signRefreshToken({ subject, jti: crypto.randomUUID() }),
  };
}
