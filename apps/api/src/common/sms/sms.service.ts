import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment';
import { GeezSmsProvider } from './providers/geez-sms.provider';
import { LoggerSmsProvider } from './providers/logger-sms.provider';
import type { SendSmsInput, SendSmsResult, SmsProvider } from './sms.interface';

@Injectable()
export class SmsService implements SmsProvider {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly config: ConfigService<Environment, true>,
    private readonly geezProvider: GeezSmsProvider,
    private readonly loggerProvider: LoggerSmsProvider,
  ) {}

  /**
   * Formats local and international Ethiopian phone numbers into Geez SMS format (2519... or 2517...).
   * Examples:
   * - "0911234567" -> "251911234567"
   * - "0711234567" -> "251711234567"
   * - "+251911234567" -> "251911234567"
   * - "251911234567" -> "251911234567"
   */
  public formatGeezPhoneNumber(phone: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('09') && digits.length === 10) {
      return `2519${digits.slice(2)}`;
    }
    if (digits.startsWith('07') && digits.length === 10) {
      return `2517${digits.slice(2)}`;
    }
    if (digits.startsWith('251') && digits.length === 12) {
      return digits;
    }
    if (
      (digits.startsWith('9') || digits.startsWith('7')) &&
      digits.length === 9
    ) {
      return `251${digits}`;
    }
    if (digits.length >= 9 && digits.length <= 15) {
      return digits;
    }
    return null;
  }

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    const isSmsEnabled = this.config.get('SMS_ENABLED', { infer: true });
    if (!isSmsEnabled) {
      this.logger.debug(
        `SMS disabled by configuration (SMS_ENABLED=false) - suppressing SMS for ${input.recipientPhone}`,
      );
      return {
        success: false,
        error: 'SMS_DISABLED',
      };
    }

    const formattedPhone = this.formatGeezPhoneNumber(input.recipientPhone);
    if (!formattedPhone) {
      this.logger.warn(
        `Invalid recipient phone number format: "${input.recipientPhone}"`,
      );
      return {
        success: false,
        error: 'INVALID_PHONE_NUMBER',
      };
    }

    const providerType = this.config.get('SMS_PROVIDER', { infer: true });
    const provider: SmsProvider =
      providerType === 'geez' ? this.geezProvider : this.loggerProvider;

    return provider.sendSms({
      ...input,
      recipientPhone: formattedPhone,
    });
  }
}
