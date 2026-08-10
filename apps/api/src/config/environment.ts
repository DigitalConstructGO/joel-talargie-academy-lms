import { z } from 'zod';
export const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    // Public origin the API itself is reachable at - used to build absolute
    // links back into the API (e.g. local-storage signed download URLs in
    // `LocalStorageProvider`). Left empty in same-origin-proxy deployments
    // (API and web served under one public domain), where those callers
    // fall back to WEB_URL; must be set whenever the API has its own origin,
    // e.g. local dev (API on :4000, web on :3000).
    API_URL: z.string().url().default(''),
    WEB_URL: z.string().url().default(''),
    TRUST_PROXY: z.stringbool().default(false),
    BODY_LIMIT: z
      .string()
      .regex(/^\d+(?:kb|mb)$/i)
      .default('1mb'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32)
      .default('development-access-secret-change-me-now'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32)
      .default('development-refresh-secret-change-me-now'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('7d'),
    AUTH_COOKIE_SECURE: z.stringbool().default(false),
    GOOGLE_CLIENT_ID: z.string().default(''),
    GOOGLE_CLIENT_SECRET: z.string().default(''),
    GOOGLE_CALLBACK_URL: z.string().url().default(''),
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
    DATABASE_STATEMENT_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15_000),
    DATABASE_QUERY_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(20_000),
    DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(30_000),
    DATABASE_MAX_USES: z.coerce.number().int().positive().default(7_500),
    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: z.string().default(''),
    SMTP_PASSWORD: z.string().default(''),
    SMTP_FROM_NAME: z.string().min(1).default('Joel Talargie Academy'),
    SMTP_FROM_EMAIL: z.string().default(''),
    SMTP_REPLY_TO: z.union([z.literal(''), z.string().email()]).default(''),
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
    SMTP_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
    SMTP_POOL_ENABLED: z.stringbool().default(true),
    SMTP_POOL_MAX_CONNECTIONS: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(3),
    SMTP_POOL_MAX_MESSAGES: z.coerce
      .number()
      .int()
      .min(1)
      .max(10_000)
      .default(100),
    EMAIL_WORKER_ENABLED: z.stringbool().default(false),
    EMAIL_WORKER_ID: z.string().max(100).default(''),
    EMAIL_WORKER_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10),
    EMAIL_WORKER_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .default(5000),
    EMAIL_WORKER_LOCK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(10_000)
      .default(120_000),
    EMAIL_MAX_RETRY_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
    EMAIL_INITIAL_RETRY_DELAY_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .default(60),
    EMAIL_MAX_RETRY_DELAY_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .default(21_600),
    EMAIL_PUBLIC_APP_URL: z.string().url().default(''),
    EMAIL_SUPPORT_ADDRESS: z
      .union([z.literal(''), z.string().email()])
      .default(''),
    EMAIL_DEFAULT_LOCALE: z
      .string()
      .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)
      .default('en'),
    MAIL_ENABLED: z.stringbool().default(false),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_ROOT: z.string().default(''),
    STORAGE_SIGNING_SECRET: z.string().default(''),
    STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(30)
      .max(86_400)
      .default(900),
    STORAGE_ENDPOINT: z.string().default(''),
    STORAGE_REGION: z.string().default(''),
    STORAGE_BUCKET: z.string().default(''),
    STORAGE_ACCESS_KEY: z.string().default(''),
    STORAGE_SECRET_KEY: z.string().default(''),
    STORAGE_FORCE_PATH_STYLE: z.stringbool().default(false),
    CERTIFICATE_PUBLIC_BASE_URL: z.string().url().default(''),
    CERTIFICATE_WORKER_ENABLED: z.stringbool().default(false),
    CERTIFICATE_WORKER_POLL_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(60000)
      .default(5000),
    CERTIFICATE_WORKER_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .default(2),
    CERTIFICATE_JOB_LOCK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(60000)
      .default(300000),
    CERTIFICATE_JOB_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5),
  })
  .superRefine((environment, context) => {
    if (
      Boolean(environment.GOOGLE_CLIENT_ID) !==
      Boolean(environment.GOOGLE_CLIENT_SECRET)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_ID'],
        message: 'Google client ID and secret must be configured together',
      });
    }
    if (!environment.WEB_URL) {
      context.addIssue({
        code: 'custom',
        path: ['WEB_URL'],
        message: 'is required',
      });
    }
    if (
      environment.NODE_ENV === 'production' &&
      (!environment.GOOGLE_CLIENT_ID || !environment.GOOGLE_CLIENT_SECRET)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_ID'],
        message: 'Google OAuth credentials are required in production',
      });
    }
    if (environment.NODE_ENV === 'production') {
      const insecureJwtDefaults = [
        'development-access-secret-change-me-now',
        'development-refresh-secret-change-me-now',
      ];
      if (insecureJwtDefaults.includes(environment.JWT_ACCESS_SECRET)) {
        context.addIssue({
          code: 'custom',
          path: ['JWT_ACCESS_SECRET'],
          message:
            'must be changed from the publicly-committed development default in production',
        });
      }
      if (insecureJwtDefaults.includes(environment.JWT_REFRESH_SECRET)) {
        context.addIssue({
          code: 'custom',
          path: ['JWT_REFRESH_SECRET'],
          message:
            'must be changed from the publicly-committed development default in production',
        });
      }
      if (environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET) {
        context.addIssue({
          code: 'custom',
          path: ['JWT_REFRESH_SECRET'],
          message: 'must be different from JWT_ACCESS_SECRET',
        });
      }
      if (!environment.STORAGE_SIGNING_SECRET) {
        context.addIssue({
          code: 'custom',
          path: ['STORAGE_SIGNING_SECRET'],
          message:
            'is required in production - do not rely on the JWT-secret or hardcoded fallback',
        });
      }
      if (!environment.AUTH_COOKIE_SECURE) {
        context.addIssue({
          code: 'custom',
          path: ['AUTH_COOKIE_SECURE'],
          message: 'must be true in production so auth cookies require HTTPS',
        });
      }
    }
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
