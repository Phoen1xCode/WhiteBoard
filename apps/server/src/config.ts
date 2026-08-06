import { z } from "zod";

import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(4000),
});

export interface ServerConfig {
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl?: string;
  port: number;
}

export function loadConfig(): ServerConfig {
  const env = envSchema.parse(process.env);
  return {
    databaseUrl: env.DATABASE_URL,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    port: env.PORT,
  };
}
