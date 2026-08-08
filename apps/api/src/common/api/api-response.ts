import type {
  ApiErrorDetail,
  ApiError,
  ApiResponse,
} from '@joel-academy/contracts';

export class ResponseBuilder {
  static success<T>(
    data: T,
    meta: Record<string, unknown> = {},
  ): ApiResponse<T> {
    return { data, meta, error: null };
  }

  static error(
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    meta: Record<string, unknown> = {},
  ): ApiError {
    return { data: null, meta, error: { code, message, details } };
  }
}

export function isApiEnvelope(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'error' in value
  );
}
