import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { z } from "zod";

import { HTTPException } from "hono/http-exception";

export class HttpError extends Error {
  public constructor(
    public readonly status: ContentfulStatusCode,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

export function formatValidationMessage(error: z.core.$ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
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
