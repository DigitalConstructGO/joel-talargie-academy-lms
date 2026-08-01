import { healthResponseSchema, type HealthResponse } from '@joel-academy/contracts';
import { apiFetch } from './api-client';
export async function getHealth(): Promise<HealthResponse> {
  return healthResponseSchema.parse(await apiFetch('/health'));
}
