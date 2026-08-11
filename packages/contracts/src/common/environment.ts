import { z } from 'zod';
export const applicationEnvironmentSchema = z.enum(['development', 'test', 'production']);
export type ApplicationEnvironment = z.infer<typeof applicationEnvironmentSchema>;
