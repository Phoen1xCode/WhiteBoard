import { zValidator } from "@hono/zod-validator";
import type { z } from "zod";

import { fail } from "@/lib/api-envelope";

function formatValidationMessage(error: z.core.$ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}

/** zValidator with the project error envelope; read the value via c.req.valid("json"). */
export function validateBody<TSchema extends z.ZodType>(schema: TSchema) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        fail("VALIDATION_ERROR", formatValidationMessage(result.error)),
        400,
      );
    }
  });
}
