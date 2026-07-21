import type { Middleware } from "koa";
import type { z } from "zod";
import { AppError } from "../lib/app-error";

type RequestWithBody = {
  body?: unknown;
};

function formatValidationMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}

export function validateBody<TBody>(schema: z.ZodType<TBody>): Middleware {
  return async (ctx, next) => {
    const request = ctx.request as typeof ctx.request & RequestWithBody;
    const result = schema.safeParse(request.body);

    if (!result.success) {
      throw new AppError(400, "VALIDATION_ERROR", formatValidationMessage(result.error));
    }

    request.body = result.data;
    await next();
  };
}
