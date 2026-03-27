import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { config } from "../config";

const secret = new TextEncoder().encode(config.JWT_SECRET);
const ALG = "HS256";

export interface AccessTokenPayload {
  userId: number;
  username: string;
  email: string;
  jti: string;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenType: "refresh";
}

export async function signAccessToken(claims: {
  userId: number;
  username: string;
  email: string;
}): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ ...claims, jti })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${config.JWT_ACCESS_TTL_MINUTES}m`)
    .sign(secret);
}

export async function signRefreshToken(userId: number): Promise<string> {
  return new SignJWT({ userId, tokenType: "refresh" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${config.JWT_REFRESH_TTL_DAYS}d`)
    .sign(secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  if ((payload as any).tokenType === "refresh") {
    throw new Error("Expected access token, got refresh token");
  }
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  if ((payload as any).tokenType !== "refresh") {
    throw new Error("Expected refresh token, got access token");
  }
  return payload as unknown as RefreshTokenPayload;
}

export function getAccessTokenTtlSeconds(): number {
  return config.JWT_ACCESS_TTL_MINUTES * 60;
}
