import { z } from "zod";

import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().optional(),
  PORT: z.coerce.number().int().positive().default(4000),
});

export function loadConfig() {
  const env = envSchema.parse(process.env);
  return {
    databaseUrl: env.DATABASE_URL,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthURL: env.BETTER_AUTH_URL,
    logLevel: env.LOG_LEVEL,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  };
}

export const config = loadConfig();
