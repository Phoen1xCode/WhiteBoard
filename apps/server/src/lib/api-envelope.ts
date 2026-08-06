export interface ApiSuccessEnvelope<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | ApiErrorEnvelope;

export function ok<TData>(data: TData): ApiSuccessEnvelope<TData> {
  return {
    success: true,
    data,
  };
}

export function fail(code: string, message: string): ApiErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}
