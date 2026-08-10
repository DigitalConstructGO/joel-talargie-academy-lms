import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SentMessageInfo, Transporter } from 'nodemailer';
import type { Environment } from '../../../config/environment';
import { MailService } from '../mail.service';

const webUrl = process.env.WEB_URL?.trim() || 'http://localhost:3000';
const apiUrl = process.env.API_URL?.trim() || 'http://localhost:4000';
const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL?.trim() ||
  `${apiUrl}/api/v1/auth/google/callback`;

const enabledEnvironment: Environment = {
  NODE_ENV: 'test',
  API_PORT: 4000,
  API_URL: apiUrl,
  WEB_URL: webUrl,
  TRUST_PROXY: false,
  BODY_LIMIT: '1mb',
  BCRYPT_SALT_ROUNDS: 12,
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-characters',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  AUTH_COOKIE_SECURE: false,
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GOOGLE_CALLBACK_URL: googleCallbackUrl,
  DATABASE_URL: '',
  DATABASE_DIRECT_URL: '',
  DATABASE_TEST_URL: '',
  DATABASE_POOL_MAX: 10,
  DATABASE_CONNECTION_TIMEOUT_MS: 10_000,
  DATABASE_IDLE_TIMEOUT_MS: 30_000,
  DATABASE_STATEMENT_TIMEOUT_MS: 15_000,
  DATABASE_QUERY_TIMEOUT_MS: 20_000,
  DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS: 30_000,
  DATABASE_MAX_USES: 7_500,
  SMTP_HOST: 'mail.test',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_USER: 'test-user',
  SMTP_PASSWORD: 'top-secret-password',
  SMTP_FROM_NAME: 'Joel Talargie Academy',
  SMTP_FROM_EMAIL: 'academy@example.com',
  SMTP_REPLY_TO: '',
  SMTP_CONNECTION_TIMEOUT_MS: 10_000,
  SMTP_GREETING_TIMEOUT_MS: 10_000,
  SMTP_SOCKET_TIMEOUT_MS: 20_000,
  SMTP_POOL_ENABLED: true,
  SMTP_POOL_MAX_CONNECTIONS: 3,
  SMTP_POOL_MAX_MESSAGES: 100,
  EMAIL_WORKER_ENABLED: false,
  EMAIL_WORKER_ID: '',
  EMAIL_WORKER_BATCH_SIZE: 10,
  EMAIL_WORKER_POLL_INTERVAL_MS: 5000,
  EMAIL_WORKER_LOCK_TIMEOUT_MS: 120_000,
  EMAIL_MAX_RETRY_ATTEMPTS: 5,
  EMAIL_INITIAL_RETRY_DELAY_SECONDS: 60,
  EMAIL_MAX_RETRY_DELAY_SECONDS: 21_600,
  EMAIL_PUBLIC_APP_URL: webUrl,
  EMAIL_SUPPORT_ADDRESS: '',
  EMAIL_DEFAULT_LOCALE: 'en',
  MAIL_ENABLED: true,
  STORAGE_DRIVER: 'local',
  STORAGE_ROOT: '',
  STORAGE_SIGNING_SECRET: '',
  STORAGE_SIGNED_URL_TTL_SECONDS: 900,
  STORAGE_ENDPOINT: '',
  STORAGE_REGION: '',
  STORAGE_BUCKET: '',
  STORAGE_ACCESS_KEY: '',
  STORAGE_SECRET_KEY: '',
  STORAGE_FORCE_PATH_STYLE: false,
  CERTIFICATE_PUBLIC_BASE_URL: `${webUrl}/certificates/verify`,
  CERTIFICATE_WORKER_ENABLED: false,
  CERTIFICATE_WORKER_POLL_MS: 5000,
  CERTIFICATE_WORKER_BATCH_SIZE: 2,
  CERTIFICATE_JOB_LOCK_TIMEOUT_MS: 300_000,
  CERTIFICATE_JOB_MAX_ATTEMPTS: 5,
};

function createService(overrides: Partial<Environment> = {}) {
  const environment = { ...enabledEnvironment, ...overrides };
  const transporter = {
    sendMail: jest.fn<Promise<SentMessageInfo>, [object]>(),
    verify: jest.fn<Promise<true>, []>(),
    close: jest.fn<void, []>(),
  };
  const config = {
    get: jest.fn((key: keyof Environment) => environment[key]),
    getOrThrow: jest.fn((key: keyof Environment) => environment[key]),
  } as unknown as ConfigService<Environment, true>;
  return {
    service: new MailService(transporter as unknown as Transporter, config),
    transporter,
  };
}

describe('MailService', () => {
  beforeEach(() =>
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined),
  );
  afterEach(() => jest.restoreAllMocks());

  it('sends valid HTML and plain-text mail using the configured sender', async () => {
    const { service, transporter } = createService();
    transporter.sendMail.mockResolvedValue({ messageId: 'message-1' });
    await expect(
      service.sendMail({
        to: 'student@example.com',
        subject: 'Welcome',
        text: 'Hello',
        html: '<p>Hello</p>',
      }),
    ).resolves.toEqual({ status: 'sent', messageId: 'message-1' });
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: 'Joel Talargie Academy', address: 'academy@example.com' },
        text: 'Hello',
        html: '<p>Hello</p>',
      }),
    );
  });

  it.each([
    [{ to: '', subject: 'Subject', text: 'Body' }, 'recipient'],
    [{ to: 'student@example.com', subject: '', text: 'Body' }, 'Subject'],
    [{ to: 'student@example.com', subject: 'Subject' }, 'Text or HTML'],
  ])('rejects invalid mail options', async (options, message) => {
    const { service } = createService();
    await expect(service.sendMail(options)).rejects.toThrow(message);
  });

  it('returns a sanitized transport failure without credentials', async () => {
    const { service, transporter } = createService();
    transporter.sendMail.mockRejectedValue(
      new Error('auth failed: top-secret-password'),
    );
    const result = await service.sendMail({
      to: 'student@example.com',
      subject: 'Test',
      text: 'Body',
    });
    expect(result).toEqual({
      status: 'failed',
      error: 'Email delivery failed',
    });
    expect(JSON.stringify(result)).not.toContain('top-secret-password');
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Email delivery failed',
    );
  });

  it('skips delivery when mail is disabled', async () => {
    const { service, transporter } = createService({ MAIL_ENABLED: false });
    await expect(
      service.sendMail({
        to: 'student@example.com',
        subject: 'Test',
        text: 'Body',
      }),
    ).resolves.toEqual({ status: 'disabled' });
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it('reports disabled connection verification without contacting SMTP', async () => {
    const { service, transporter } = createService({ MAIL_ENABLED: false });
    await expect(service.verifyConnection()).resolves.toEqual({
      status: 'disabled',
    });
    expect(transporter.verify).not.toHaveBeenCalled();
  });

  it('reports successful connection verification', async () => {
    const { service, transporter } = createService();
    transporter.verify.mockResolvedValue(true);
    await expect(service.verifyConnection()).resolves.toEqual({
      status: 'available',
    });
  });

  it('sanitizes connection verification failures', async () => {
    const { service, transporter } = createService();
    transporter.verify.mockRejectedValue(new Error('top-secret-password'));
    await expect(service.verifyConnection()).resolves.toEqual({
      status: 'unavailable',
      error: 'Email connection unavailable',
    });
  });

  it('reuses the injected transporter and closes it during shutdown', async () => {
    const { service, transporter } = createService();
    transporter.sendMail.mockResolvedValue({ messageId: 'message-1' });
    await service.sendMail({
      to: 'one@example.com',
      subject: 'One',
      text: 'Body',
    });
    await service.sendMail({
      to: 'two@example.com',
      subject: 'Two',
      html: '<p>Body</p>',
    });
    expect(transporter.sendMail).toHaveBeenCalledTimes(2);
    service.onModuleDestroy();
    expect(transporter.close).toHaveBeenCalledTimes(1);
  });
});
