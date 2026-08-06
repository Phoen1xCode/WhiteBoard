import type { z } from "zod";

import { zValidator } from "@hono/zod-validator";

import { errorBody } from "@/shared/http/error-handler";

function formatValidationMessage(error: z.core.$ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}

/** zValidator with the project error shape; read the value via c.req.valid("json"). */
export function validateBody<TSchema extends z.ZodType>(schema: TSchema) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(errorBody("VALIDATION_ERROR", formatValidationMessage(result.error)), 400);
    }
  });
}
