import type { AuthenticatedUser, JwtTokenPayload } from "@/types/auth";

import { AppError } from "@/lib/app-error";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export interface ResolvedAccess {
  token: string;
  payload: JwtTokenPayload;
  user: AuthenticatedUser;
}

/** Single path: access token → authenticated user (HTTP + Socket). */
export async function resolveAccessToken(token: string): Promise<ResolvedAccess> {
  let payload: JwtTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return {
    token,
    payload,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  };
}
