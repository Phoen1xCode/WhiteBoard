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
