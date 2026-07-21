export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly expose: boolean;

  public constructor(status: number, code: string, message: string, expose = true) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
