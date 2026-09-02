import { Injectable, Logger } from '@nestjs/common';
import { TelegramConfigService } from './telegram-config.service';
import type { TelegramUpdate } from '../dto/telegram-update.dto';

import { ProxyAgent } from 'undici';

@Injectable()
export class TelegramClientService {
  private readonly logger = new Logger(TelegramClientService.name);

  constructor(private readonly config: TelegramConfigService) {}

  private get fetchOptions(): Record<string, unknown> {
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.HTTP_PROXY ||
      process.env.https_proxy ||
      process.env.http_proxy;
    if (proxyUrl) {
      try {
        return { dispatcher: new ProxyAgent(proxyUrl) };
      } catch {
        return {};
      }
    }
    return {};
  }

  private get apiUrl(): string {
    const base = (this.config.apiBaseUrl || 'https://api.telegram.org').replace(
      /\/+$/,
      '',
    );
    return `${base}/bot${this.config.botToken}`;
  }

  private isConnectionError(error: unknown): boolean {
    if (!error) return false;
    const str = String(error);
    const code = (error as any)?.code || (error as any)?.cause?.code;
    const name = (error as any)?.name;
    return (
      str.includes('ConnectTimeoutError') ||
      str.includes('TimeoutError') ||
      str.includes('aborted due to timeout') ||
      str.includes('fetch failed') ||
      name === 'TimeoutError' ||
      code === 'UND_ERR_CONNECT_TIMEOUT' ||
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === 'ETIMEDOUT'
    );
  }

  async sendMessage(params: {
    chat_id: number | string;
    text: string;
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: Record<string, unknown>;
  }): Promise<boolean> {
    if (!this.config.botToken) {
      this.logger.warn(
        'Cannot send Telegram message: TELEGRAM_BOT_TOKEN is not configured.',
      );
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10_000),
        ...this.fetchOptions,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Telegram sendMessage API error [${response.status}]: ${errorText}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      if (this.isConnectionError(error)) {
        this.logger.warn(
          `Telegram API (${this.config.apiBaseUrl}) unreachable or connection timed out during sendMessage.`,
        );
      } else {
        this.logger.error('Failed to send Telegram message:', error);
      }
      return false;
    }
  }

  async getUpdates(offset?: number, timeout = 10): Promise<TelegramUpdate[]> {
    if (!this.config.botToken) return [];

    try {
      const url = new URL(`${this.apiUrl}/getUpdates`);
      if (offset) url.searchParams.append('offset', String(offset));
      url.searchParams.append('timeout', String(timeout));

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout((timeout + 5) * 1000),
        ...this.fetchOptions,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Telegram getUpdates API error [${response.status}]: ${errorText}`,
        );
        return [];
      }

      const data = (await response.json()) as {
        ok: boolean;
        result: TelegramUpdate[];
      };
      return data.ok ? data.result : [];
    } catch (error) {
      if (this.isConnectionError(error)) {
        this.logger.warn(
          `Telegram API (${this.config.apiBaseUrl}) unreachable or connection timed out during getUpdates polling.`,
        );
      } else {
        this.logger.error(
          'Error fetching Telegram updates via getUpdates polling:',
          error,
        );
      }
      return [];
    }
  }

  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    if (!this.config.botToken) return false;

    try {
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          secret_token: secretToken,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Telegram setWebhook error [${response.status}]: ${errorText}`,
        );
        return false;
      }

      const data = (await response.json()) as { ok: boolean };
      this.logger.log(`Telegram webhook registered successfully to ${url}`);
      return data.ok;
    } catch (error) {
      if (this.isConnectionError(error)) {
        this.logger.warn(
          `Telegram API (${this.config.apiBaseUrl}) unreachable during setWebhook.`,
        );
      } else {
        this.logger.error('Failed to set Telegram webhook:', error);
      }
      return false;
    }
  }

  async deleteWebhook(): Promise<boolean> {
    if (!this.config.botToken) return false;

    try {
      const response = await fetch(`${this.apiUrl}/deleteWebhook`, {
        method: 'POST',
        signal: AbortSignal.timeout(5_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
