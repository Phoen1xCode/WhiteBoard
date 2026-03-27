import { AuthError } from "../services/auth.service";
import { BoardError } from "../services/board.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler({ code, error, set }: any) {
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
