import type { AuthenticatedUser } from "@/types/auth";

import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";

export interface ResolvedAccess {
  token: string;
  user: AuthenticatedUser;
}

/** Single path: session token → authenticated user (HTTP + Socket). */
export async function resolveAccessToken(token: string): Promise<ResolvedAccess> {
  const result = await auth.api.getSession({
    headers: new Headers({ authorization: `Bearer ${token}` }),
  });

  if (!result) {
    throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      username: result.user.name,
    },
  };
}
