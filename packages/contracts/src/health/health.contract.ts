import { z } from 'zod';
import { apiResponseSchema } from '../api/api-response';
import { applicationEnvironmentSchema } from '../common/environment';
export const healthDataSchema = z.object({
  service: z.literal('joel-talargie-academy-api'),
  status: z.literal('ok'),
  environment: applicationEnvironmentSchema,
  version: z.string(),
  timestamp: z.string().datetime(),
});
export const healthResponseSchema = apiResponseSchema(healthDataSchema);
export type HealthResponse = z.infer<typeof healthResponseSchema>;
