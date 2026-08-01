import { z } from 'zod';
export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
});
export type Environment = z.infer<typeof environmentSchema>;
export function validateEnvironment(
  value: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      `Invalid application configuration: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return result.data;
}
