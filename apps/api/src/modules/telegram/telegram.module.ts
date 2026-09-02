import {
  Module,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { TelegramController } from './telegram.controller';
import { TelegramConfigService } from './services/telegram-config.service';
import { TelegramClientService } from './services/telegram-client.service';
import { TelegramIdentityResolverService } from './services/telegram-identity-resolver.service';
import { TelegramUpdateService } from './services/telegram-update.service';
import { TelegramLinkService } from './services/telegram-link.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TelegramController],
  providers: [
    TelegramConfigService,
    TelegramClientService,
    TelegramIdentityResolverService,
    TelegramUpdateService,
    TelegramLinkService,
  ],
  exports: [
    TelegramConfigService,
    TelegramClientService,
    TelegramIdentityResolverService,
    TelegramUpdateService,
    TelegramLinkService,
  ],
})
export class TelegramModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramModule.name);
  private isPollingActive = false;
  private lastUpdateOffset = 0;

  constructor(
    private readonly config: TelegramConfigService,
    private readonly client: TelegramClientService,
    private readonly updateService: TelegramUpdateService,
  ) {}

  async onModuleInit() {
    if (!this.config.isEnabled) {
      this.logger.log(
        'Telegram integration is disabled (TELEGRAM_ENABLED=false).',
      );
      return;
    }

    if (!this.config.botToken) {
      this.logger.warn(
        'TELEGRAM_ENABLED is true but TELEGRAM_BOT_TOKEN is empty.',
      );
      return;
    }

    this.logger.log(
      `Initializing Telegram Bot Module [Username: @${this.config.botUsername}, Mode: ${this.config.mode}]`,
    );

    if (this.config.mode === 'webhook') {
      if (this.config.webhookUrl) {
        await this.client.setWebhook(
          this.config.webhookUrl,
          this.config.webhookSecret,
        );
      } else {
        this.logger.warn(
          'TELEGRAM_MODE=webhook but TELEGRAM_WEBHOOK_URL is not provided.',
        );
      }
    } else if (this.config.mode === 'polling') {
      await this.client.deleteWebhook();
      this.startPollingLoop();
    }
  }

  onModuleDestroy() {
    this.isPollingActive = false;
  }

  private startPollingLoop() {
    if (this.isPollingActive) return;
    this.isPollingActive = true;
    this.logger.log('Started Telegram long-polling loop.');

    // Asynchronous background long polling execution loop
    (async () => {
      let backoffMs = 5000;
      while (this.isPollingActive) {
        try {
          const updates = await this.client.getUpdates(
            this.lastUpdateOffset + 1,
            10,
          );
          backoffMs = 5000;
          for (const update of updates) {
            if (update.update_id >= this.lastUpdateOffset) {
              this.lastUpdateOffset = update.update_id;
            }
            await this.updateService.handleUpdate(update);
          }
          await new Promise((res) => setTimeout(res, 1000));
        } catch (error) {
          this.logger.error('Error in Telegram polling loop:', error);
          await new Promise((res) => setTimeout(res, backoffMs));
          backoffMs = Math.min(backoffMs * 2, 30000);
        }
      }
    })();
  }
}
