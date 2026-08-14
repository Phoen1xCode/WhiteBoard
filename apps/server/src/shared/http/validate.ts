import type { z } from "zod";

export function formatValidationMessage(error: z.core.$ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}
