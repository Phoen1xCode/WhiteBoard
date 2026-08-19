import type { AuthenticatedUser } from "@whiteboard/shared/schemas";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, jwt, username } from "better-auth/plugins";

import { config } from "@/config";
import { db } from "@/db";
import { CLIENT_IP_HEADER } from "@/lib/client-ip";
import { HttpError } from "@/lib/errors";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthURL,
  basePath: "/api/v1/auth",
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    enabled: true,
    customRules: {
      "/login": { window: 60, max: 10 },
      "/register": { window: 60, max: 5 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: [CLIENT_IP_HEADER],
    },
  },
  plugins: [
    bearer(),
    username({
      minUsernameLength: 4,
      maxUsernameLength: 15,
      // Match the existing public register contract (any 3–50 char handle).
      usernameValidator: () => true,
    }),
    jwt(),
  ],
});

export function isJWT(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function bearerHeaders(token: string): Headers {
  return new Headers({ authorization: `Bearer ${token}` });
}

export async function issueAccessToken(sessionToken: string): Promise<string> {
  const result = await auth.api.getToken({
    headers: bearerHeaders(sessionToken),
  });
  if (!result?.token) {
    throw new HttpError(500, "INTERNAL_SERVER_ERROR", "Failed to issue access token");
  }
  return result.token;
}

export async function resolveAccessToken(
  token: string,
): Promise<{ token: string; user: AuthenticatedUser }> {
  if (isJWT(token)) {
    return resolveJwtAccessToken(token);
  }

  const result = await auth.api.getSession({
    headers: bearerHeaders(token),
  });

  if (!result?.user.username) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
    },
  };
}

async function resolveJwtAccessToken(
  token: string,
): Promise<{ token: string; user: AuthenticatedUser }> {
  const verified = await auth.api.verifyJWT({
    body: { token },
  });
  const payload = verified?.payload;
  const id = payload?.sub;
  const email = typeof payload?.email === "string" ? payload.email : null;
  const username = typeof payload?.username === "string" ? payload.username : null;

  if (!id || !email || !username) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return {
    token,
    user: { id, email, username },
  };
}
