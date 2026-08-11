export interface ApiErrorDetail {
  field?: string;
  message: string;
}
export interface ApiError {
  data: null;
  meta: Record<string, unknown>;
  error: { code: string; message: string; details: ApiErrorDetail[] };
}
