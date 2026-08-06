import { Hono } from "hono";
import { cors } from "hono/cors";

import { fail } from "@/lib/api-envelope";
import { auth } from "@/lib/auth";
import { errorHandler } from "@/middleware/error";
import { createAuthRouter } from "@/routes/auth";
import { createBoardsRouter } from "@/routes/boards";

import "@/types/hono";

export function createApp(): Hono {
  const app = new Hono();

  app.use(cors());
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  app.route("/", createAuthRouter());
  app.route("/", createBoardsRouter());

  app.onError(errorHandler);
  app.notFound((c) => c.json(fail("NOT_FOUND", "Not Found"), 404));

  return app;
}
