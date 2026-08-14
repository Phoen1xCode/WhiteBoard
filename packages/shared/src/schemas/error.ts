import { z } from "zod";

export const API_ERROR_CODES = [
  "UNAUTHORIZED",
  "VALIDATION_ERROR",
  "EMAIL_ALREADY_EXISTS",
  "USERNAME_ALREADY_EXISTS",
  "INVALID_CREDENTIALS",
  "INTERNAL_SERVER_ERROR",
  "RATE_LIMITED",
  "RATE_LIMIT_UNAVAILABLE",
  "BOARD_NOT_FOUND",
  "FORBIDDEN",
  "INVALID_OPERATION",
  "NOT_JOINED",
  "NOT_FOUND",
  "HTTP_ERROR",
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const DEFINITIVE_API_ERROR_CODES = [
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "INVALID_OPERATION",
  "UNAUTHORIZED",
  "BOARD_NOT_FOUND",
] as const satisfies readonly ApiErrorCode[];

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export function errorBody(code: ApiErrorCode, message: string): ApiErrorBody {
  return { error: { code, message } };
}
