import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { TelegramConfigService } from './services/telegram-config.service';
import { TelegramUpdateService } from './services/telegram-update.service';
import { TelegramLinkService } from './services/telegram-link.service';
import type { TelegramUpdate } from './dto/telegram-update.dto';
import type {
  TelegramLinkResponseDto,
  TelegramStatusResponseDto,
} from './dto/telegram-link.dto';

// Trigger hot reload for TG4 Telegram Controller
@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    @Inject(TelegramConfigService)
    private readonly config: TelegramConfigService,
    @Inject(TelegramUpdateService)
    private readonly updateService: TelegramUpdateService,
    @Inject(TelegramLinkService)
    private readonly linkService: TelegramLinkService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-telegram-bot-api-secret-token')
    secretHeader: string | undefined,
    @Body() update: TelegramUpdate,
  ) {
    if (this.config.webhookSecret) {
      if (!secretHeader || secretHeader !== this.config.webhookSecret) {
        this.logger.warn(
          'Rejected unauthorized Telegram webhook request: secret token mismatch',
        );
        throw new UnauthorizedException('Invalid webhook secret token');
      }
    }

    await this.updateService.handleUpdate(update);
    return { status: 'ok' };
  }

  @ApiBearerAuth()
  @Post('link')
  @HttpCode(HttpStatus.OK)
  async createTelegramLink(
    @CurrentUser() user: AuthUser,
  ): Promise<TelegramLinkResponseDto> {
    try {
      return await this.linkService.generateLinkToken(user.id);
    } catch (err: any) {
      this.logger.error(
        `Error generating Telegram link token for user ${user?.id}:`,
        err,
      );
      throw err;
    }
  }

  @ApiBearerAuth()
  @Get('status')
  async getTelegramStatus(
    @CurrentUser() user: AuthUser,
  ): Promise<TelegramStatusResponseDto> {
    return this.linkService.getLinkStatus(user.id);
  }

  @ApiBearerAuth()
  @Delete('link')
  @HttpCode(HttpStatus.OK)
  async unlinkTelegram(
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.linkService.unlinkTelegramAccount(user.id);
  }
}
