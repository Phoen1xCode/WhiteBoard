export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly expose: boolean;

  public constructor(status: number, code: string, message: string, expose = true) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
