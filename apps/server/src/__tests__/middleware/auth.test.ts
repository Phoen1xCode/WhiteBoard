import { describe, test, expect, mock, beforeEach } from "bun:test";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test-secret-must-be-at-least-32-characters-for-hs256";
