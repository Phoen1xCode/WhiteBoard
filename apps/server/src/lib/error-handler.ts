import type { Elysia } from "elysia";
import { AuthError } from "../services/auth.service";
import { BoardError } from "../services/board.service";

export function errorHandler({
  code,
  error,
  set,
}: {
  code: string;
  error: Error;
  set: { status: number };
}) {
  if (error instanceof AuthError) {
    set.status = error.status;
    return { error: error.message };
  }
  if (error instanceof BoardError) {
    set.status = error.status;
    return { error: error.message };
  }
  if (code === "VALIDATION") {
    set.status = 422;
    return { error: String(error) };
  }
  set.status = 500;
  console.error("Unhandled error:", error);
  return { error: "Internal Server Error" };
}
