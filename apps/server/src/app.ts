import { Hono } from "hono";
import { cors } from "hono/cors";

import { errorBody, errorHandler } from "@/shared/http/error-handler";

export interface AppDeps {
  authRouter: Hono;
  boardsRouter: Hono;
}

export function createApp({ authRouter, boardsRouter }: AppDeps): Hono {
  const app = new Hono();

  app.use(cors());
  app.route("/", authRouter);
  app.route("/", boardsRouter);

  app.onError(errorHandler);
  app.notFound((c) => c.json(errorBody("NOT_FOUND", "Not Found"), 404));

  return app;
}
