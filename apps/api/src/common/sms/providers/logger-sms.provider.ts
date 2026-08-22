import { Injectable, Logger } from '@nestjs/common';
import type {
  SendSmsInput,
  SendSmsResult,
  SmsProvider,
} from '../sms.interface';

@Injectable()
export class LoggerSmsProvider implements SmsProvider {
  private readonly logger = new Logger(LoggerSmsProvider.name);

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    this.logger.log(
      `[DEV LOG SMS] Recipient: ${input.recipientPhone} | Template: ${input.templateCode} | Message: "${input.messageText}"`,
    );
    return {
      success: true,
      providerMessageId: `logger-${Date.now()}`,
      responseCode: '200',
    };
  }
}
