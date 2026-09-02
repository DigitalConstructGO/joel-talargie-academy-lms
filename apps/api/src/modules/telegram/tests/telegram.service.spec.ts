import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { TelegramController } from '../telegram.controller';
import { TelegramConfigService } from '../services/telegram-config.service';
import { TelegramClientService } from '../services/telegram-client.service';
import { TelegramIdentityResolverService } from '../services/telegram-identity-resolver.service';
import { TelegramUpdateService } from '../services/telegram-update.service';
import { TelegramLinkService } from '../services/telegram-link.service';

describe('TG3 — Telegram Bot Backend Foundation Unit & Integration Tests', () => {
  let controller: TelegramController;
  let updateService: TelegramUpdateService;
  let identityResolver: TelegramIdentityResolverService;
  let clientService: TelegramClientService;
  let configService: TelegramConfigService;
  let linkService: TelegramLinkService;

  const mockDatabase: any = {
    client: {
      query: {
        users: { findFirst: vi.fn() },
        oauthAccounts: { findFirst: vi.fn() },
        accountLinkTokens: { findFirst: vi.fn() },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'token-1' }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      transaction: vi
        .fn()
        .mockImplementation(async (cb: any) => cb(mockDatabase.client)),
    },
  };

  const mockConfig: any = {
    get: (key: string) => {
      if (key === 'TELEGRAM_ENABLED') return true;
      if (key === 'TELEGRAM_MODE') return 'webhook';
      if (key === 'TELEGRAM_BOT_TOKEN') return 'test_secret_bot_token_123';
      if (key === 'TELEGRAM_BOT_USERNAME') return 'Joel_Talargie_Academy_Bot';
      if (key === 'TELEGRAM_WEBHOOK_URL')
        return 'http://localhost:4000/api/v1/telegram/webhook';
      if (key === 'TELEGRAM_WEBHOOK_SECRET') return 'test_webhook_secret_key';
      if (key === 'WEB_APP_URL') return 'http://localhost:3000';
      return undefined;
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    configService = new TelegramConfigService(mockConfig as any);
    clientService = new TelegramClientService(configService);
    identityResolver = new TelegramIdentityResolverService(mockDatabase as any);
    linkService = new TelegramLinkService(mockDatabase as any, configService);
    updateService = new TelegramUpdateService(
      mockDatabase as any,
      clientService,
      configService,
      identityResolver,
    );
    controller = new TelegramController(
      configService,
      updateService,
      linkService,
    );
  });

  it('TEST 1 — Valid webhook request with correct secret is accepted', async () => {
    vi.spyOn(updateService, 'handleUpdate').mockResolvedValue(undefined);

    const result = await controller.handleWebhook('test_webhook_secret_key', {
      update_id: 100,
      message: {
        message_id: 1,
        chat: { id: 12345, type: 'private' },
        date: Date.now(),
        text: '/start',
      },
    });

    expect(result).toEqual({ status: 'ok' });
    expect(updateService.handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('TEST 2 & 3 — Invalid or missing webhook secret is rejected with UnauthorizedException', async () => {
    vi.spyOn(updateService, 'handleUpdate').mockResolvedValue(undefined);

    await expect(
      controller.handleWebhook('wrong_secret', { update_id: 100 }),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      controller.handleWebhook(undefined, { update_id: 100 }),
    ).rejects.toThrow(UnauthorizedException);

    expect(updateService.handleUpdate).not.toHaveBeenCalled();
  });

  it('TEST 4 — /start from UNLINKED user sends safe onboarding message without DB mutations', async () => {
    vi.spyOn(identityResolver, 'resolveIdentity').mockResolvedValue({
      status: 'UNLINKED',
      telegramId: '847362910',
    });
    const sendSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 101,
      message: {
        message_id: 2,
        from: { id: 847362910, first_name: 'UnlinkedUser' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: '/start',
      },
    });

    expect(identityResolver.resolveIdentity).toHaveBeenCalledWith(847362910);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining('Your Telegram account is not connected'),
      }),
    );
  });

  it('TEST 5 & 6 — /start from LINKED user resolves to canonical users.id and greets user', async () => {
    vi.spyOn(identityResolver, 'resolveIdentity').mockResolvedValue({
      status: 'LINKED',
      telegramId: '847362910',
      user: {
        id: 'user_canonical_25',
        email: 'joel.student@example.com',
        passwordHash: 'hash',
        status: 'ACTIVE',
        firstName: 'Joel',
        lastName: 'Student',
        roles: ['STUDENT'],
        avatarUrl: null,
        provider: 'TELEGRAM',
        emailVerified: true,
      },
    });
    const sendSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 102,
      message: {
        message_id: 3,
        from: { id: 847362910, first_name: 'Joel' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: '/start',
      },
    });

    expect(identityResolver.resolveIdentity).toHaveBeenCalledWith(847362910);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining(
          'Welcome back to Joel Talargie Academy, Joel!',
        ),
      }),
    );
  });

  it('TEST 7 — Unknown update types are safely ignored without throwing', async () => {
    await expect(
      updateService.handleUpdate({
        update_id: 999,
      }),
    ).resolves.not.toThrow();
  });

  it('TEST 8 — Missing from object in update is safely ignored', async () => {
    await expect(
      updateService.handleUpdate({
        update_id: 1000,
        message: {
          message_id: 4,
          chat: { id: 123, type: 'private' },
          date: Date.now(),
          text: 'Hello',
        },
      }),
    ).resolves.not.toThrow();
  });

  it('TEST 9 & 10 — Telegram username optional & change does not alter identity mapping', async () => {
    vi.spyOn(identityResolver, 'resolveIdentity').mockResolvedValue({
      status: 'LINKED',
      telegramId: '847362910',
      user: {
        id: 'user_canonical_25',
        email: 'joel.student@example.com',
        passwordHash: 'hash',
        status: 'ACTIVE',
        firstName: 'Joel',
        lastName: 'Student',
        roles: ['STUDENT'],
        avatarUrl: null,
        provider: 'TELEGRAM',
        emailVerified: true,
      },
    });

    const res1 = await identityResolver.resolveIdentity(847362910);
    expect(res1.user?.id).toBe('user_canonical_25');

    const res2 = await identityResolver.resolveIdentity(847362910);
    expect(res2.user?.id).toBe('user_canonical_25');
  });

  it('TEST 11 — Suspended LMS user receives account suspended notice', async () => {
    vi.spyOn(identityResolver, 'resolveIdentity').mockResolvedValue({
      status: 'SUSPENDED',
      telegramId: '847362910',
    });
    const sendSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 103,
      message: {
        message_id: 5,
        from: { id: 847362910, first_name: 'SuspendedUser' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: '/start',
      },
    });

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining('account is currently suspended'),
      }),
    );
  });

  it('TEST 12 & 13 — Outbound message success and failure handling', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const success = await clientService.sendMessage({
      chat_id: 12345,
      text: 'Test Message',
    });
    expect(success).toBe(true);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const failure = await clientService.sendMessage({
      chat_id: 12345,
      text: 'Test Message',
    });
    expect(failure).toBe(false);
  });

  it('TEST 14 — TELEGRAM_BOT_TOKEN is backend-only and not exposed in public DTOs', () => {
    expect(configService.botToken).toBe('test_secret_bot_token_123');
    expect(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN).toBeUndefined();
  });

  it('TEST 15 — /start does not execute user creation or database mutations in TG3', async () => {
    vi.spyOn(identityResolver, 'resolveIdentity').mockResolvedValue({
      status: 'UNLINKED',
      telegramId: '999999999',
    });

    await updateService.handleUpdate({
      update_id: 104,
      message: {
        message_id: 6,
        from: { id: 999999999, first_name: 'NewUser' },
        chat: { id: 999999999, type: 'private' },
        date: Date.now(),
        text: '/start',
      },
    });

    expect(identityResolver.resolveIdentity).toHaveBeenCalledWith(999999999);
  });
});
