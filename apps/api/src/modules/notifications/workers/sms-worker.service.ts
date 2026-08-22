import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Environment } from '../../../config/environment';
import { SmsService } from '../../../common/sms/sms.service';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class SmsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsWorkerService.name);
  private readonly workerId = `sms-worker-${randomUUID()}`;
  private timer: NodeJS.Timeout | undefined;
  private processing = false;

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly smsService: SmsService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  onModuleInit() {
    const isEnabled = this.config.get('SMS_WORKER_ENABLED', { infer: true });
    if (isEnabled) {
      const intervalMs = this.config.get('SMS_WORKER_POLL_MS', { infer: true });
      this.timer = setInterval(() => void this.runSafely(), intervalMs);
      void this.runSafely();
    }
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async runSafely() {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.processQueue();
    } catch (err) {
      this.logger.error('SMS worker cycle error:', err);
    } finally {
      this.processing = false;
    }
  }

  private async processQueue() {
    for (;;) {
      const row = await this.repository.claimSmsDelivery(this.workerId);
      if (!row) break;

      const deliveryId = String(row.id);
      const phone = String(row.recipient_phone);
      const messageText = String(row.message_text);
      const templateCode = String(row.template_code);
      const deduplicationKey = row.deduplication_key
        ? String(row.deduplication_key)
        : undefined;
      const maxAttempts = Number(row.maximum_attempts ?? 3);

      try {
        const result = await this.smsService.sendSms({
          recipientPhone: phone,
          messageText,
          templateCode,
          deduplicationKey,
        });

        if (result.success) {
          await this.repository.markSmsDeliverySuccess(
            deliveryId,
            result.providerMessageId,
            result.providerLogId,
          );
        } else {
          await this.repository.markSmsDeliveryFailure(
            deliveryId,
            result.responseCode || 'SMS_SEND_FAILED',
            result.error || 'SMS provider returned error response',
            maxAttempts,
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await this.repository.markSmsDeliveryFailure(
          deliveryId,
          'UNHANDLED_EXCEPTION',
          errorMsg,
          maxAttempts,
        );
      }
    }
  }
}
