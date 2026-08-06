import type { PrismaClient } from "@generated/client";

import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

import type { ServerConfig } from "@/config";

export function createBetterAuth({
  prisma,
  config,
}: {
  prisma: PrismaClient;
  config: ServerConfig;
}) {
  return betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
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
}

export type BetterAuth = ReturnType<typeof createBetterAuth>;
