import type { Middleware } from "koa";

import { isAppError } from "../lib/app-error";
import { failure } from "../lib/response";

interface HttpError extends Error {
  status?: number;
  code?: string;
  expose?: boolean;
  originalError?: Error;
}

function isHttpError(error: unknown): error is HttpError {
  return error instanceof Error;
}

export const errorMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (isAppError(error)) {
      ctx.status = error.status;
      ctx.body = failure(error.code, error.expose ? error.message : "Internal Server Error");
      ctx.app.emit("error", error, ctx);
      return;
    }

    if (isHttpError(error) && error.status === 401) {
      ctx.status = 401;
      ctx.body = failure("UNAUTHORIZED", "Unauthorized");
      ctx.app.emit("error", error, ctx);
      return;
    }

    ctx.status = isHttpError(error) && error.status ? error.status : 500;
    ctx.body = failure("INTERNAL_SERVER_ERROR", "Internal Server Error");
    ctx.app.emit("error", error, ctx);
  }
};
