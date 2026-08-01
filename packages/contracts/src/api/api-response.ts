import { z } from 'zod';
export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  error: null;
}
export const apiResponseSchema = <T extends z.ZodType>(data: T) =>
  z.object({ data, meta: z.record(z.string(), z.unknown()), error: z.null() });
