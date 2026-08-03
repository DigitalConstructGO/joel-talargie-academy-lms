import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Environment } from '../../config/environment';
import { MAIL_TRANSPORTER } from './mail.constants';
import { MailService } from './mail.service';
import type { MailTransporter } from './mail.types';

export function createMailTransporter(
  config: ConfigService<Environment, true>,
): MailTransporter {
  return nodemailer.createTransport({
    pool: config.get('SMTP_POOL_ENABLED', { infer: true }),
    host: config.get('SMTP_HOST', { infer: true }),
    port: config.get('SMTP_PORT', { infer: true }),
    secure: config.get('SMTP_SECURE', { infer: true }),
    auth: config.get('SMTP_USER', { infer: true })
      ? {
          user: config.get('SMTP_USER', { infer: true }),
          pass: config.get('SMTP_PASSWORD', { infer: true }),
        }
      : undefined,
    connectionTimeout: config.get('SMTP_CONNECTION_TIMEOUT_MS', {
      infer: true,
    }),
    greetingTimeout: config.get('SMTP_GREETING_TIMEOUT_MS', { infer: true }),
    socketTimeout: config.get('SMTP_SOCKET_TIMEOUT_MS', { infer: true }),
    maxConnections: config.get('SMTP_POOL_MAX_CONNECTIONS', { infer: true }),
    maxMessages: config.get('SMTP_POOL_MAX_MESSAGES', { infer: true }),
  });
}

@Module({
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      inject: [ConfigService],
      useFactory: createMailTransporter,
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
