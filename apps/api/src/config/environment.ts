import { z } from 'zod';
export const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    WEB_URL: z.string().url().default('http://localhost:3000'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    DATABASE_URL: z.string().default(''),
    DATABASE_DIRECT_URL: z.string().default(''),
    DATABASE_TEST_URL: z.string().default(''),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    DATABASE_CONNECTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10_000),
    DATABASE_IDLE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(30_000),
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
    const validateUrl = (
      key: 'DATABASE_URL' | 'DATABASE_DIRECT_URL' | 'DATABASE_TEST_URL',
    ) => {
      const value = environment[key];
      if (!value) return;
      try {
        const url = new URL(value);
        const sslMode = url.searchParams.get('sslmode');
        if (
          !['postgres:', 'postgresql:'].includes(url.protocol) ||
          url.pathname.length <= 1 ||
          !sslMode ||
          ['disable', 'allow', 'prefer'].includes(sslMode)
        )
          throw new Error();
      } catch {
        context.addIssue({
          code: 'custom',
          path: [key],
          message: 'must be a valid SSL PostgreSQL URL',
        });
      }
    };

    validateUrl('DATABASE_URL');
    validateUrl('DATABASE_DIRECT_URL');
    validateUrl('DATABASE_TEST_URL');
    if (environment.NODE_ENV === 'production' && !environment.DATABASE_URL) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'is required in production',
      });
    }
    if (
      environment.DATABASE_TEST_URL &&
      [environment.DATABASE_URL, environment.DATABASE_DIRECT_URL].includes(
        environment.DATABASE_TEST_URL,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_TEST_URL'],
        message: 'must use an isolated test database',
      });
    }

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
      `Invalid application configuration: ${result.error.issues.map((i) => `${i.path.some((part) => String(part).startsWith('DATABASE_')) ? 'Database configuration' : i.path.includes('SMTP_PASSWORD') ? 'SMTP configuration' : i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return result.data;
}
