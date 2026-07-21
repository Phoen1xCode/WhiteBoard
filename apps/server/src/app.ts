import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { createAuthRouter } from "./routes/auth";
import { createBoardsRouter } from "./routes/boards";
import { errorMiddleware } from "./middleware/error";
import "./types/koa";

export function createApp(): Koa {
  const app = new Koa();
  const authRouter = createAuthRouter();
  const boardsRouter = createBoardsRouter();

  app.use(errorMiddleware);
  app.use(cors());
  app.use(bodyParser());
  app.use(authRouter.routes());
  app.use(authRouter.allowedMethods());
  app.use(boardsRouter.routes());
  app.use(boardsRouter.allowedMethods());

  return app;
}
