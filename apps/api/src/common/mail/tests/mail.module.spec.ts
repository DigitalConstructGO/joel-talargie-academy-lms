import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Environment } from '../../../config/environment';
import { createMailTransporter } from '../mail.module';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn(() => ({ sendMail: jest.fn() })) },
}));

describe('mail transporter provider', () => {
  it('creates one transporter with validated server configuration', () => {
    const values: Partial<Environment> = {
      SMTP_HOST: 'mail.test',
      SMTP_PORT: 587,
      SMTP_SECURE: false,
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'password',
      SMTP_CONNECTION_TIMEOUT_MS: 10_000,
      SMTP_GREETING_TIMEOUT_MS: 10_000,
      SMTP_SOCKET_TIMEOUT_MS: 15_000,
    };
    const config = {
      get: jest.fn((key: keyof Environment) => values[key]),
    } as unknown as ConfigService<Environment, true>;

    const first = createMailTransporter(config);

    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'mail.test',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'password' },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    expect(first).toBeDefined();
  });
});
