import { Injectable, Logger } from '@nestjs/common';
import {
  findAuthUserByTelegramId,
  type AuthUserRecord,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';

export type TelegramIdentityResolutionStatus =
  'LINKED' | 'UNLINKED' | 'SUSPENDED';

export interface TelegramIdentityResolution {
  status: TelegramIdentityResolutionStatus;
  user?: AuthUserRecord;
  telegramId: string;
}

@Injectable()
export class TelegramIdentityResolverService {
  private readonly logger = new Logger(TelegramIdentityResolverService.name);

  constructor(private readonly database: DatabaseService) {}

  async resolveIdentity(
    telegramUserId: number | string,
  ): Promise<TelegramIdentityResolution> {
    const telegramIdStr = String(telegramUserId).trim();
    if (
      !telegramIdStr ||
      telegramIdStr === '0' ||
      telegramIdStr === 'undefined'
    ) {
      return { status: 'UNLINKED', telegramId: telegramIdStr };
    }

    try {
      const authUser = await findAuthUserByTelegramId(
        this.database.client,
        telegramIdStr,
      );

      if (!authUser) {
        return { status: 'UNLINKED', telegramId: telegramIdStr };
      }

      if (authUser.status === 'SUSPENDED' || authUser.status === 'ARCHIVED') {
        this.logger.warn(
          `Telegram ID ${telegramIdStr} linked to ${authUser.status} user ${authUser.id}`,
        );
        return {
          status: 'SUSPENDED',
          user: authUser,
          telegramId: telegramIdStr,
        };
      }

      return { status: 'LINKED', user: authUser, telegramId: telegramIdStr };
    } catch (error) {
      this.logger.error(
        `Error resolving identity for Telegram ID ${telegramIdStr}:`,
        error,
      );
      return { status: 'UNLINKED', telegramId: telegramIdStr };
    }
  }
}
