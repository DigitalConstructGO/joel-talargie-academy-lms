import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { TelegramClientService } from './telegram-client.service';
import { TelegramConfigService } from './telegram-config.service';
import { TelegramFormattingService } from './telegram-formatting.service';
import { eq, schema } from '@joel-academy/database';

@Injectable()
export class TelegramTransactionalNotificationService {
  private readonly logger = new Logger(
    TelegramTransactionalNotificationService.name,
  );

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(TelegramClientService)
    private readonly telegramClient: TelegramClientService,
    @Inject(TelegramConfigService)
    private readonly telegramConfig: TelegramConfigService,
    @Inject(TelegramFormattingService)
    private readonly formatting: TelegramFormattingService,
  ) {}

  /**
   * Send payment approval notification to student Telegram chat.
   */
  async notifyPaymentApproved(
    userId: string,
    courseTitle: string,
    amount: string,
  ): Promise<boolean> {
    const account = await this.database.client.query.oauthAccounts.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.userId, userId), eq(table.provider, 'TELEGRAM')),
    });

    if (!account || !account.providerAccountId) return false;
    const chatId = parseInt(account.providerAccountId, 10);
    if (isNaN(chatId)) return false;

    const webUrl = this.telegramConfig.webAppUrl || 'http://localhost:3000';
    const inline_keyboard: Array<
      Array<{ text: string; url?: string; callback_data?: string }>
    > = [];
    if (webUrl && webUrl.startsWith('https://')) {
      inline_keyboard.push([
        { text: '▶️ Start Course', url: `${webUrl}/dashboard/my-courses` },
      ]);
    }
    inline_keyboard.push([
      { text: '📚 My Courses', callback_data: 'student_my_courses' },
    ]);

    return this.telegramClient.sendMessage({
      chat_id: Number(account.providerAccountId),
      text:
        `✅ <b>Payment Approved!</b>\n\n` +
        `Your payment for <b>${this.formatting.escapeHtml(courseTitle)}</b> has been approved by an administrator.\n\n` +
        `Enrollment Status: <b>Active ✅</b>\n` +
        `Course Access: 🔓 <b>Unlocked</b>\n\n` +
        `Your course is now ready to start!`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard },
    });
  }

  /**
   * Send payment decline notification to student Telegram chat.
   */
  async notifyPaymentDeclined(
    userId: string,
    courseTitle: string,
    reason?: string,
  ): Promise<boolean> {
    const account = await this.database.client.query.oauthAccounts.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.userId, userId), eq(table.provider, 'TELEGRAM')),
    });

    if (!account || !account.providerAccountId) return false;
    const chatId = parseInt(account.providerAccountId, 10);
    if (isNaN(chatId)) return false;

    const webUrl = this.telegramConfig.webAppUrl || 'http://localhost:3000';
    let text =
      `❌ <b>Payment Not Approved</b>\n\n` +
      `Your payment submission for <b>${this.formatting.escapeHtml(courseTitle)}</b> was not approved.\n\n` +
      `Status: <b>Rejected ❌</b>\n` +
      `Course Access: 🔒 <b>Locked</b>`;

    if (reason) {
      text += `\nReason: ${this.formatting.escapeHtml(reason)}`;
    }

    return this.telegramClient.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 View Payments', callback_data: 'student_payments' }],
          [{ text: '🌐 Open Academy', url: `${webUrl}/dashboard/payments` }],
        ],
      },
    });
  }
}
