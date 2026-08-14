import type { ApiErrorCode } from "@whiteboard/shared/schemas";
import type { Context, Env, ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { z } from "zod";

import { errorBody } from "@whiteboard/shared/schemas";
import { HTTPException } from "hono/http-exception";

export { errorBody };

export class HttpError extends Error {
  public constructor(
    public readonly status: ContentfulStatusCode,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function formatValidationMessage(error: z.core.$ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}

export function validationError<E extends Env, P extends string>(
  c: Context<E, P>,
  error: z.core.$ZodError,
) {
  return c.json(errorBody("VALIDATION_ERROR", formatValidationMessage(error)), 400);
}

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof HttpError) {
    const message = error.status >= 500 ? "Internal Server Error" : error.message;
    return c.json(errorBody(error.code, message), error.status);
  }

  if (error instanceof HTTPException) {
    const message = error.status >= 500 ? "Internal Server Error" : error.message;
    return c.json(errorBody("HTTP_ERROR", message), error.status);
  }

  console.error(error);
  return c.json(errorBody("INTERNAL_SERVER_ERROR", "Internal Server Error"), 500);
};
