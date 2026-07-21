process.env.JWT_ACCESS_SECRET ??= "test-access-secret-please-change";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-please-change";
process.env.JWT_ACCESS_EXPIRES_IN ??= "15m";
process.env.JWT_REFRESH_EXPIRES_IN ??= "7d";
process.env.REDIS_URL ??= "memory://";
process.env.PORT ??= "0";
// Placeholder so modules that touch prisma can load; unit tests mock repositories.
process.env.DATABASE_URL ??=
  "postgresql://whiteboard:whiteboard@127.0.0.1:5432/whiteboard_test";
