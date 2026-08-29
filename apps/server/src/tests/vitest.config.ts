import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  root,
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "@generated": path.resolve(root, "prisma/generated"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/index.ts", "src/middleware/logger.ts"],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://whiteboard:whiteboard@localhost:5432/whiteboard_test",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
      BETTER_AUTH_URL: "http://localhost:4000",
    },
    include: ["src/tests/**/*.test.ts"],
  },
});
