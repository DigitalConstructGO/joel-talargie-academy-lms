import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import {
  createAccountLinkToken,
  unlinkTelegramAccount as dbUnlinkTelegramAccount,
  eq,
  and,
  isNull,
  schema,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { TelegramConfigService } from './telegram-config.service';
import type {
  TelegramLinkResponseDto,
  TelegramStatusResponseDto,
} from '../dto/telegram-link.dto';

export const TELEGRAM_LINK_PURPOSE = 'TELEGRAM_LINK';
export const LINK_TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class TelegramLinkService {
  private readonly logger = new Logger(TelegramLinkService.name);

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(TelegramConfigService)
    private readonly telegramConfig: TelegramConfigService,
  ) {}

  async generateLinkToken(userId: string): Promise<TelegramLinkResponseDto> {
    const user = await this.database.client.query.users.findFirst({
      where: and(eq(schema.users.id, userId), isNull(schema.users.archivedAt)),
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    if (user.status === 'SUSPENDED' || user.status === 'ARCHIVED') {
      throw new ForbiddenException(
        'Account is suspended or inactive. Telegram linking is unavailable.',
      );
    }

    const existingAccount =
      await this.database.client.query.oauthAccounts.findFirst({
        where: and(
          eq(schema.oauthAccounts.userId, userId),
          eq(schema.oauthAccounts.provider, 'TELEGRAM'),
        ),
      });

    if (existingAccount) {
      return {
        alreadyLinked: true,
        telegramUrl: '',
        expiresAt: '',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + LINK_TOKEN_EXPIRATION_MS);

    await createAccountLinkToken(this.database.client, {
      userId,
      purpose: TELEGRAM_LINK_PURPOSE,
      tokenHash,
      expiresAt,
    });

    const telegramUrl = this.telegramConfig.buildTelegramStartUrl(rawToken);

    this.logger.log(
      `Generated Telegram link token for user ID ${userId}, expires at ${expiresAt.toISOString()}`,
    );

    return {
      telegramUrl,
      expiresAt: expiresAt.toISOString(),
      alreadyLinked: false,
    };
  }

  async getLinkStatus(userId: string): Promise<TelegramStatusResponseDto> {
    const account = await this.database.client.query.oauthAccounts.findFirst({
      where: and(
        eq(schema.oauthAccounts.userId, userId),
        eq(schema.oauthAccounts.provider, 'TELEGRAM'),
      ),
    });

    if (!account) {
      return { connected: false };
    }

    return {
      connected: true,
      username: account.providerEmail ?? null,
      linkedAt: account.linkedAt
        ? new Date(account.linkedAt).toISOString()
        : null,
    };
  }

  async unlinkTelegramAccount(userId: string): Promise<{ success: boolean }> {
    const success = await dbUnlinkTelegramAccount(this.database.client, userId);
    if (!success) {
      throw new NotFoundException('No linked Telegram account found to remove');
    }
    this.logger.log(`Unlinked Telegram account for user ID ${userId}`);
    return { success: true };
  }
}
