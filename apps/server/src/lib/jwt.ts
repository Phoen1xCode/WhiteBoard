import "dotenv/config";
import { SignJWT, jwtVerify } from "jose";

export type TokenType = "access" | "refresh";

export interface SignTokenInput {
  subject: string;
  jti: string;
  expiresIn?: string;
}

export interface VerifiedTokenPayload {
  sub: string;
  jti: string;
  type: TokenType;
  exp?: number;
  iat?: number;
}

const textEncoder = new TextEncoder();

function getSecret(tokenType: TokenType): Uint8Array {
  const envName = tokenType === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET";
  const secret = process.env[envName];

  if (!secret) {
    throw new Error(`${envName} is not set`);
  }

  return textEncoder.encode(secret);
}

function getExpiresIn(tokenType: TokenType, expiresIn?: string): string {
  if (expiresIn) {
    return expiresIn;
  }

  if (tokenType === "access") {
    return process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
  }

  return process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
}

async function signToken(tokenType: TokenType, input: SignTokenInput): Promise<string> {
  return await new SignJWT({ type: tokenType })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.subject)
    .setJti(input.jti)
    .setIssuedAt()
    .setExpirationTime(getExpiresIn(tokenType, input.expiresIn))
    .sign(getSecret(tokenType));
}

async function verifyToken(token: string, expectedType: TokenType): Promise<VerifiedTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(expectedType));

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

export async function signAccessToken(input: SignTokenInput): Promise<string> {
  return await signToken("access", input);
}

export async function signRefreshToken(input: SignTokenInput): Promise<string> {
  return await signToken("refresh", input);
}

export async function verifyAccessToken(token: string): Promise<VerifiedTokenPayload> {
  return await verifyToken(token, "access");
}

export async function verifyRefreshToken(token: string): Promise<VerifiedTokenPayload> {
  return await verifyToken(token, "refresh");
}
