import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../config/environment';
import type {
  SendSmsInput,
  SendSmsResult,
  SmsProvider,
} from '../sms.interface';

@Injectable()
export class GeezSmsProvider implements SmsProvider {
  private readonly logger = new Logger(GeezSmsProvider.name);
  private readonly apiUrl = 'https://api.geezsms.com/api/v1/sms/send';

  constructor(private readonly config: ConfigService<Environment, true>) {}

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    const token = this.config.get('GEEZ_SMS_TOKEN', { infer: true })?.trim();
    if (!token || token.includes('replace-with')) {
      this.logger.warn(
        `GEEZ_SMS_TOKEN is unconfigured or placeholder - suppressing live SMS output for ${input.recipientPhone}`,
      );
      return {
        success: false,
        error: 'GEEZ_SMS_TOKEN_UNCONFIGURED',
      };
    }

    const shortcodeId = this.config
      .get('GEEZ_SMS_SHORTCODE_ID', { infer: true })
      ?.trim();
    const callbackUrl = this.config
      .get('GEEZ_SMS_CALLBACK_URL', { infer: true })
      ?.trim();

    try {
      const formData = new URLSearchParams();
      formData.append('token', token);
      formData.append('phone', input.recipientPhone);
      formData.append('msg', input.messageText.substring(0, 335));
      if (shortcodeId) {
        formData.append('shortcode_id', shortcodeId);
      }
      if (callbackUrl) {
        formData.append('callback', callbackUrl);
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = (await response.json()) as {
        message_status?: string;
        status?: string;
        log?: string;
        api_log_id?: number | string;
        error?: boolean | string;
        msg?: string;
        message?: string;
        data?: {
          msg?: string;
          api_log_id?: number | string;
          date?: string;
        };
      };

      const logId = data.api_log_id ?? data.data?.api_log_id ?? data.log;

      const isSuccess =
        response.ok &&
        (data.error === false ||
          data.message_status === 'success' ||
          data.status === 'success' ||
          data.data?.msg === 'SMS_SENT_SUCCSSFULLY' ||
          Boolean(data.msg?.toLowerCase().includes('success')) ||
          Boolean(logId));

      if (isSuccess) {
        this.logger.log(
          `Geez SMS successfully sent to ${input.recipientPhone} (api_log_id: ${logId ?? 'N/A'})`,
        );
        return {
          success: true,
          providerMessageId: String(logId ?? ''),
          providerLogId: data.log ?? undefined,
          responseCode: String(response.status),
        };
      }

      const failureReason =
        typeof data.error === 'string'
          ? data.error
          : data.message || JSON.stringify(data);
      this.logger.error(
        `Geez SMS API failed for ${input.recipientPhone}: ${failureReason} (HTTP ${response.status})`,
      );

      return {
        success: false,
        responseCode: String(response.status),
        error: failureReason,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to post request to Geez SMS API: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
