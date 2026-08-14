import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

import { config } from "@/config";
import { db } from "@/db";
import { HttpError } from "@/lib/errors";

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  emailAndPassword: {
    enabled: true,
    // Keep bcrypt so hashes backfilled into Account stay valid.
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  user: {
    modelName: "User",
    fields: {
      name: "username",
    },
  },
  plugins: [bearer()],
});

export async function resolveAccessToken(
  token: string,
): Promise<{ token: string; user: AuthenticatedUser }> {
  const result = await auth.api.getSession({
    headers: new Headers({ authorization: `Bearer ${token}` }),
  });

  if (!result) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
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
