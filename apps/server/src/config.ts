import { z } from "zod";

import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(4000),
});

export function loadConfig() {
  const env = envSchema.parse(process.env);
  return {
    databaseUrl: env.DATABASE_URL,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    logLevel: env.LOG_LEVEL,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  };
}

export const config = loadConfig();
