export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/** Extracts a human-readable message from an axios error response, falling back to `fallback`. */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const body = (
      error as { response?: { data?: { error?: { message?: string }; message?: string } } }
    ).response?.data;
    return body?.error?.message ?? body?.message ?? fallback;
  }
  return fallback;
}

/**
 * Extracts the backend's machine-readable error code (e.g. `PAYMENT_REQUIRED`,
 * `ENROLLMENT_NOT_FOUND`) from an axios error response, for callers that want
 * to branch on the specific failure reason rather than just display a
 * message - e.g. the lesson learn page distinguishing "payment still under
 * review" from "you were never enrolled" instead of one generic error.
 */
export function extractErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error && 'response' in error) {
    const body = (error as { response?: { data?: { error?: { code?: string } } } }).response?.data;
    return body?.error?.code;
  }
  return undefined;
}
