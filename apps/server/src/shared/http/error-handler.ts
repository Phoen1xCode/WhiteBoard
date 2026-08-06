import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { HTTPException } from "hono/http-exception";

import { isApiError } from "@/shared/api-error";

export function errorBody(
  code: string,
  message: string,
): { error: { code: string; message: string } } {
  return { error: { code, message } };
}

export const errorHandler: ErrorHandler = (error, c) => {
  if (isApiError(error)) {
    return c.json(
      errorBody(error.code, error.expose ? error.message : "Internal Server Error"),
      error.status as ContentfulStatusCode,
    );
  }

  if (error instanceof HTTPException) {
    return c.json(errorBody("HTTP_ERROR", error.message), error.status);
  }

  console.error(error);
  return c.json(errorBody("INTERNAL_SERVER_ERROR", "Internal Server Error"), 500);
};
