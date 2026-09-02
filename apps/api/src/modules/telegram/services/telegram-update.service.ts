import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'node:crypto';
import {
  consumeAccountLinkToken,
  linkTelegramAccount,
  schema,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { TelegramClientService } from './telegram-client.service';
import { TelegramConfigService } from './telegram-config.service';
import { TelegramIdentityResolverService } from './telegram-identity-resolver.service';
import { TELEGRAM_LINK_PURPOSE } from './telegram-link.service';
import type { TelegramUpdate } from '../dto/telegram-update.dto';

@Injectable()
export class TelegramUpdateService {
  private readonly logger = new Logger(TelegramUpdateService.name);

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(TelegramClientService)
    private readonly telegramClient: TelegramClientService,
    @Inject(TelegramConfigService)
    private readonly telegramConfig: TelegramConfigService,
    @Inject(TelegramIdentityResolverService)
    private readonly identityResolver: TelegramIdentityResolverService,
  ) {}

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (!update) return;

    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.edited_message) {
        await this.handleMessage(update.edited_message);
      } else if (update.my_chat_member) {
        this.logger.log(
          `Bot status updated for Telegram user ${update.my_chat_member.from.id}`,
        );
      } else if (update.callback_query) {
        this.logger.log(
          `Received callback query ID ${update.callback_query.id}`,
        );
      } else {
        this.logger.debug(
          `Ignored unhandled update type ID ${update.update_id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing update ID ${update?.update_id}:`,
        error,
      );
    }
  }

  private async handleMessage(
    message: NonNullable<TelegramUpdate['message']>,
  ): Promise<void> {
    const fromUser = message.from;
    if (!fromUser || !fromUser.id) {
      this.logger.debug('Message update ignored: missing valid sender from.id');
      return;
    }

    const text = message.text?.trim() || '';
    const chatId = message.chat.id;

    if (text.startsWith('/start')) {
      await this.handleStartCommand({
        chatId,
        telegramUserId: fromUser.id,
        telegramUsername: fromUser.username,
        firstName: fromUser.first_name,
        fullText: text,
      });
    } else {
      this.logger.log(
        `Message from Telegram user ${fromUser.id}: ${text.slice(0, 30)}`,
      );
    }
  }

  private async handleStartCommand(params: {
    chatId: number;
    telegramUserId: number;
    telegramUsername?: string;
    firstName: string;
    fullText: string;
  }): Promise<void> {
    const parts = params.fullText.split(/\s+/);
    const payload = parts.slice(1).join(' ').trim() || undefined;

    if (payload) {
      this.logger.log(
        `Received /start linking payload attempt from Telegram ID ${params.telegramUserId}`,
      );

      await this.processLinkPayload({
        chatId: params.chatId,
        telegramUserId: params.telegramUserId,
        telegramUsername: params.telegramUsername,
        payload,
      });
      return;
    }

    const resolution = await this.identityResolver.resolveIdentity(
      params.telegramUserId,
    );

    if (resolution.status === 'LINKED' && resolution.user) {
      const welcomeText =
        `Welcome back to Joel Talargie Academy, ${resolution.user.firstName || params.firstName}!\n\n` +
        `✅ Your Telegram account is linked to your LMS account (${resolution.user.email}).\n` +
        `Academy learning services will be accessible here in upcoming features.`;

      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: welcomeText,
      });
      return;
    }

    if (resolution.status === 'SUSPENDED') {
      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: 'Your Joel Academy account is currently suspended. Please contact platform support.',
      });
      return;
    }

    // UNLINKED status without payload
    const unlinkedText =
      `Welcome to Joel Talargie Academy!\n\n` +
      `Your Telegram account is not connected to an academy account yet.\n` +
      `To connect your account, go to Profile / Settings on the academy website and click "Connect Telegram".`;

    await this.telegramClient.sendMessage({
      chat_id: params.chatId,
      text: unlinkedText,
    });
  }

  private async processLinkPayload(params: {
    chatId: number;
    telegramUserId: number;
    telegramUsername?: string;
    payload: string;
  }): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(params.payload)
      .digest('hex');

    const result = await consumeAccountLinkToken(this.database.client, {
      tokenHash,
      purpose: TELEGRAM_LINK_PURPOSE,
    });

    if (!result.valid) {
      if (result.reason === 'TOKEN_EXPIRED') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'This connection link has expired.\nPlease create a new Telegram connection link from your academy account.',
        });
        return;
      }

      if (result.reason === 'TOKEN_ALREADY_USED') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'This connection link has already been used.\nPlease return to your academy account.',
        });
        return;
      }

      // Invalid token
      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: 'This connection link is invalid.',
      });
      return;
    }

    const userId = result.userId!;

    try {
      await linkTelegramAccount(this.database.client, {
        userId,
        telegramId: String(params.telegramUserId),
        telegramUsername: params.telegramUsername,
      });

      this.logger.log(
        `Successfully linked Telegram ID ${params.telegramUserId} to LMS user ID ${userId}`,
      );

      // Create in-app notification for the web application
      try {
        const usernameDisplay = params.telegramUsername
          ? `@${params.telegramUsername.replace(/^@/, '')}`
          : 'account';
        await this.database.client.insert(schema.notifications).values({
          userId,
          channel: 'IN_APP',
          status: 'SENT',
          type: 'TELEGRAM_ACCOUNT_LINKED',
          title: 'Telegram Account Connected',
          body: `Your Telegram account (${usernameDisplay}) was successfully connected to your academy profile.`,
          actionUrl: '/dashboard/profile',
          priority: 'NORMAL',
          deduplicationKey: `in-app:telegram-link:${params.telegramUserId}:${Date.now()}`,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        this.logger.warn(
          'Failed to insert in-app notification for Telegram link:',
          notifErr,
        );
      }

      const dashboardReturnUrl = `${this.telegramConfig.webAppUrl}/dashboard/profile`;
      const hasValidHttpsUrl = dashboardReturnUrl.startsWith('https://');

      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text:
          `✅ Telegram Connected\n\n` +
          `Your Telegram account is now connected to your Joel Talargie Academy account.\n\n` +
          `You can return to the academy website.`,
        ...(hasValidHttpsUrl
          ? {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Open Academy',
                      url: dashboardReturnUrl,
                    },
                  ],
                ],
              },
            }
          : {}),
      });
    } catch (error: any) {
      const msg = error?.message || String(error);

      if (msg === 'TELEGRAM_ID_ALREADY_LINKED_TO_OTHER_USER') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'This Telegram account is already connected to another academy account.',
        });
        return;
      }

      if (msg === 'USER_ALREADY_HAS_LINKED_TELEGRAM_ACCOUNT') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'Your academy account already has a Telegram account connected.',
        });
        return;
      }

      this.logger.error(
        `Failed to link Telegram account for user ${userId}:`,
        error,
      );

      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: 'An error occurred while linking your Telegram account. Please try again from the website.',
      });
    }
  }
}
