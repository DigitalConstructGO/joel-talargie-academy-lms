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
