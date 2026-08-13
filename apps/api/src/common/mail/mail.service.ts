import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment';
import { MAIL_TRANSPORTER } from './mail.constants';
import type {
  MailConnectionStatus,
  MailSendResult,
  MailTransporter,
  SendMailOptions,
} from './mail.types';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(MAIL_TRANSPORTER) private readonly transporter: MailTransporter,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async sendMail(options: SendMailOptions): Promise<MailSendResult> {
    this.validateOptions(options);
    if (!this.config.get('MAIL_ENABLED', { infer: true })) {
      this.logger.debug('Email delivery skipped because mail is disabled');
      return { status: 'disabled' };
    }

    try {
      const recipients: string | string[] =
        typeof options.to === 'string' ? options.to : [...options.to];
      const info: unknown = await this.transporter.sendMail({
        ...options,
        to: recipients,
        attachments: options.attachments ? [...options.attachments] : undefined,
        from: {
          name: this.config.getOrThrow('SMTP_FROM_NAME', { infer: true }),
          address: this.config.getOrThrow('SMTP_FROM_EMAIL', { infer: true }),
        },
      });
      const messageId =
        typeof info === 'object' &&
        info !== null &&
        'messageId' in info &&
        typeof info.messageId === 'string'
          ? info.messageId
          : undefined;
      return { status: 'sent', ...(messageId ? { messageId } : {}) };
    } catch (error) {
      this.logger.error(`Email delivery failed: ${this.redact(error)}`);
      return { status: 'failed', error: 'Email delivery failed' };
    }
  }

  async verifyConnection(): Promise<MailConnectionStatus> {
    if (!this.config.get('MAIL_ENABLED', { infer: true }))
      return { status: 'disabled' };
    try {
      await this.transporter.verify();
      return { status: 'available' };
    } catch (error) {
      this.logger.error(
        `Email connection verification failed: ${this.redact(error)}`,
      );
      return { status: 'unavailable', error: 'Email connection unavailable' };
    }
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }

  // Log the underlying SMTP error so the cause is diagnosable, but never let
  // the configured password (raw or whitespace-stripped) appear in logs.
  private redact(error: unknown): string {
    const raw = this.config.get('SMTP_PASSWORD', { infer: true });
    const secrets = new Set(
      [raw, raw.replace(/\s+/g, '')].filter((value) => value.length > 0),
    );
    let detail = error instanceof Error ? error.message : String(error ?? '');
    for (const secret of secrets) detail = detail.split(secret).join('[REDACTED]');
    return detail;
  }

  private validateOptions(options: SendMailOptions): void {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    if (
      recipients.length === 0 ||
      recipients.some((recipient) => !recipient.trim())
    ) {
      throw new TypeError('At least one recipient is required');
    }
    if (!options.subject.trim()) throw new TypeError('Subject is required');
    if (!options.text?.trim() && !options.html?.trim()) {
      throw new TypeError('Text or HTML content is required');
    }
  }
}
