import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";

import { isApiError } from "@/lib/api-error";
import { fail } from "@/lib/api-envelope";

export const errorHandler: ErrorHandler = (error, c) => {
  if (isApiError(error)) {
    return c.json(
      fail(error.code, error.expose ? error.message : "Internal Server Error"),
      error.status as ContentfulStatusCode,
    );
  }

  if (error instanceof HTTPException) {
    return c.json(fail("HTTP_ERROR", error.message), error.status);
  }

  console.error(error);
  return c.json(fail("INTERNAL_SERVER_ERROR", "Internal Server Error"), 500);
};
