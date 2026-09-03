export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiFieldError {
  field: string;
  message: string;
}

interface AxiosLikeError {
  isAxiosError?: boolean;
  code?: string;
  response?: {
    status?: number;
    data?: { error?: { message?: string; details?: unknown }; message?: string };
  };
  request?: unknown;
}

/** Generic copy for HTTP statuses the backend didn't attach its own message to. */
const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  400: 'That request was invalid. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: 'That could not be found.',
  409: 'That conflicts with existing data. Please refresh and try again.',
  422: 'Please check the highlighted fields and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again.',
};

/**
 * Extracts a human-readable message from an API error, falling back to
 * `fallback`. Prefers the backend's own message, then a status-code-specific
 * default, then a network/timeout-specific message, then `fallback`.
 */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error !== 'object' || !error) return fallback;
  const axiosError = error as AxiosLikeError;

  if (axiosError.response) {
    const body = axiosError.response.data;
    const details = body?.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      const fieldMessages = details
        .map((d: unknown) =>
          typeof d === 'string'
            ? d
            : typeof d === 'object' && d !== null && 'message' in d
              ? String((d as { message: unknown }).message)
              : '',
        )
        .filter(Boolean);
      if (fieldMessages.length > 0) {
        return fieldMessages.join(', ');
      }
    }
    const backendMessage = body?.error?.message ?? body?.message;
    if (backendMessage) return backendMessage;
    const status = axiosError.response.status;
    return (status !== undefined && STATUS_FALLBACK_MESSAGES[status]) || fallback;
  }

  if (axiosError.isAxiosError && axiosError.code === 'ECONNABORTED') {
    return 'The request timed out. Please check your connection and try again.';
  }
  if (axiosError.isAxiosError && axiosError.request) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return fallback;
}

/**
 * Extracts per-field validation errors from a 422/400 response's
 * `error.details` (populated server-side by `validationExceptionFactory` in
 * `apps/api/src/common/pipes/validation-exception-factory.ts`), for callers
 * that want to highlight the specific form field a backend validation rule
 * rejected (via `form.setError(field, { message })`) instead of only
 * showing a generic toast. Returns `[]` for errors with no structured field
 * details - e.g. a plain 500, or a 422 thrown by hand without per-field
 * detail - callers should fall back to `extractErrorMessage` in that case.
 */
export function extractFieldErrors(error: unknown): ApiFieldError[] {
  if (typeof error !== 'object' || !error) return [];
  const details = (error as AxiosLikeError).response?.data?.error?.details;
  if (!Array.isArray(details)) return [];
  return details.filter(
    (item): item is ApiFieldError =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { field?: unknown }).field === 'string' &&
      typeof (item as { message?: unknown }).message === 'string',
  );
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
