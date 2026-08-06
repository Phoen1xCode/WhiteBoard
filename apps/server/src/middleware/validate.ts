import type { MiddlewareHandler } from "hono";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";

function formatValidationMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}

export function validateBody<TBody>(schema: z.ZodType<TBody>): MiddlewareHandler {
  return async (c, next) => {
    const result = schema.safeParse(await c.req.json().catch(() => undefined));

    if (!result.success) {
      throw new ApiError(400, "VALIDATION_ERROR", formatValidationMessage(result.error));
    }

    c.set("body", result.data);
    await next();
  };
}
