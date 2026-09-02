import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramConfigService {
  constructor(private readonly configService: ConfigService) {}

  get isEnabled(): boolean {
    return Boolean(this.configService.get<boolean>('TELEGRAM_ENABLED'));
  }

  get mode(): 'polling' | 'webhook' {
    return (
      (this.configService.get<string>('TELEGRAM_MODE') as
        'polling' | 'webhook') || 'polling'
    );
  }

  get botToken(): string {
    return this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
  }

  get botUsername(): string {
    return this.configService.get<string>('TELEGRAM_BOT_USERNAME') || '';
  }

  get webhookUrl(): string {
    return this.configService.get<string>('TELEGRAM_WEBHOOK_URL') || '';
  }

  get webhookSecret(): string {
    return this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') || '';
  }

  get apiBaseUrl(): string {
    return (
      this.configService.get<string>('TELEGRAM_API_BASE_URL') ||
      'https://api.telegram.org'
    );
  }

  get webAppUrl(): string {
    return (
      this.configService.get<string>('WEB_APP_URL') ||
      this.configService.get<string>('EMAIL_PUBLIC_APP_URL') ||
      'http://localhost:3000'
    );
  }

  buildTelegramStartUrl(payload: string): string {
    const rawUsername = this.botUsername.replace(/^@/, '').trim();
    const cleanPayload = encodeURIComponent(payload.trim());
    return `https://t.me/${rawUsername}?start=${cleanPayload}`;
  }
}
