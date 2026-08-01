import { z } from 'zod';
export const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    WEB_URL: z.string().url().default('http://localhost:3000'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: z.string().default(''),
    SMTP_PASSWORD: z.string().default(''),
    SMTP_FROM_NAME: z.string().min(1).default('Joel Talargie Academy'),
    SMTP_FROM_EMAIL: z.string().default(''),
    SMTP_CONNECTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10_000),
    SMTP_GREETING_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10_000),
    SMTP_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
    MAIL_ENABLED: z.stringbool().default(false),
  })
  .superRefine((environment, context) => {
    if (!environment.MAIL_ENABLED) return;

    if (!environment.SMTP_HOST) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_HOST'],
        message: 'is required when mail is enabled',
      });
    }
    if (!z.email().safeParse(environment.SMTP_FROM_EMAIL).success) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_FROM_EMAIL'],
        message: 'must be a valid email when mail is enabled',
      });
    }
    if (environment.SMTP_PASSWORD && !environment.SMTP_USER) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_USER'],
        message: 'is required when SMTP authentication is configured',
      });
    }
    if (environment.SMTP_USER && !environment.SMTP_PASSWORD) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_PASSWORD'],
        message: 'is required when SMTP authentication is configured',
      });
    }
    if (environment.NODE_ENV === 'production') {
      const values = [environment.SMTP_USER, environment.SMTP_PASSWORD];
      if (
        values.some((value) => /^(replace|placeholder|changeme)/i.test(value))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['SMTP_USER'],
          message: 'placeholder SMTP credentials are not allowed in production',
        });
      }
    }
  });
export type Environment = z.infer<typeof environmentSchema>;
export function validateEnvironment(
  value: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      `Invalid application configuration: ${result.error.issues.map((i) => `${i.path.includes('SMTP_PASSWORD') ? 'SMTP configuration' : i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return result.data;
}
