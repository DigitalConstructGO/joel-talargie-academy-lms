import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SentMessageInfo, Transporter } from 'nodemailer';
import type { Environment } from '../../../config/environment';
import { MailService } from '../mail.service';

const enabledEnvironment: Environment = {
  NODE_ENV: 'test',
  API_PORT: 4000,
  WEB_URL: 'http://localhost:3000',
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
  GOOGLE_CALLBACK_URL: 'http://localhost:5000/api/v1/auth/google/callback',
  DATABASE_URL: '',
  DATABASE_DIRECT_URL: '',
  DATABASE_TEST_URL: '',
  DATABASE_POOL_MAX: 10,
  DATABASE_CONNECTION_TIMEOUT_MS: 10_000,
  DATABASE_IDLE_TIMEOUT_MS: 30_000,
  SMTP_HOST: 'mail.test',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_USER: 'test-user',
  SMTP_PASSWORD: 'top-secret-password',
  SMTP_FROM_NAME: 'Joel Talargie Academy',
  SMTP_FROM_EMAIL: 'academy@example.com',
  SMTP_CONNECTION_TIMEOUT_MS: 10_000,
  SMTP_GREETING_TIMEOUT_MS: 10_000,
  SMTP_SOCKET_TIMEOUT_MS: 15_000,
  MAIL_ENABLED: true,
  STORAGE_ENDPOINT: '',
  STORAGE_REGION: '',
  STORAGE_BUCKET: '',
  STORAGE_ACCESS_KEY: '',
  STORAGE_SECRET_KEY: '',
  STORAGE_FORCE_PATH_STYLE: false,
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
