import "dotenv/config";

export interface Config {
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  PORT: number;
  JWT_ACCESS_TTL_MINUTES: number;
  JWT_REFRESH_TTL_DAYS: number;
  CORS_ORIGIN: string;
  COMPACTION_THRESHOLD: number;
  COMPACTION_INTERVAL_SECONDS: number;
  WS_MAX_PAYLOAD_BYTES: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new Error(`Invalid integer for ${name}: ${value}`);
  return parsed;
}

export function loadConfig(): Config {
  return {
    DATABASE_URL: required("DATABASE_URL"),
    REDIS_URL: required("REDIS_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    PORT: optionalInt("PORT", 3000),
    JWT_ACCESS_TTL_MINUTES: optionalInt("JWT_ACCESS_TTL_MINUTES", 15),
    JWT_REFRESH_TTL_DAYS: optionalInt("JWT_REFRESH_TTL_DAYS", 7),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
    COMPACTION_THRESHOLD: optionalInt("COMPACTION_THRESHOLD", 100),
    COMPACTION_INTERVAL_SECONDS: optionalInt("COMPACTION_INTERVAL_SECONDS", 30),
    WS_MAX_PAYLOAD_BYTES: optionalInt("WS_MAX_PAYLOAD_BYTES", 65536),
  };
}

export const config = loadConfig();
