import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as crypto from 'node:crypto';
import { TelegramController } from '../telegram.controller';
import { TelegramConfigService } from '../services/telegram-config.service';
import { TelegramClientService } from '../services/telegram-client.service';
import { TelegramIdentityResolverService } from '../services/telegram-identity-resolver.service';
import { TelegramUpdateService } from '../services/telegram-update.service';
import {
  TelegramLinkService,
  TELEGRAM_LINK_PURPOSE,
} from '../services/telegram-link.service';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

describe('TG4 — Web-First Telegram Account Linking Specification Tests', () => {
  let controller: TelegramController;
  let linkService: TelegramLinkService;
  let updateService: TelegramUpdateService;
  let clientService: TelegramClientService;
  let configService: TelegramConfigService;
  let identityResolver: TelegramIdentityResolverService;

  const mockUser: AuthUser = {
    id: 'user_canonical_25',
    email: 'student@example.com',
    firstName: 'Student',
    lastName: 'Test',
    roles: ['STUDENT'],
    avatarUrl: null,
    provider: 'LOCAL',
    emailVerified: true,
    sessionId: 'session-123',
  };

  const mockDatabase: any = {
    client: {
      query: {
        users: {
          findFirst: vi.fn(),
        },
        oauthAccounts: {
          findFirst: vi.fn(),
        },
        accountLinkTokens: {
          findFirst: vi.fn(),
        },
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
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
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
      if (key === 'TELEGRAM_BOT_TOKEN') return 'test_secret_bot_token_123';
      if (key === 'TELEGRAM_BOT_USERNAME') return 'Joel_Talargie_Academy_Bot';
      if (key === 'WEB_APP_URL') return 'http://localhost:3000';
      if (key === 'TELEGRAM_WEBHOOK_SECRET') return 'test_webhook_secret_key';
      return undefined;
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    configService = new TelegramConfigService(mockConfig as any);
    clientService = new TelegramClientService(configService);
    identityResolver = new TelegramIdentityResolverService(mockDatabase as any);
    linkService = new TelegramLinkService(mockDatabase as any, configService);
    const mockRegistrationService = {
      startRegistration: vi.fn(),
      submitEmail: vi.fn(),
      submitOtp: vi.fn(),
      resendOtp: vi.fn(),
      changeEmail: vi.fn(),
      cancelRegistration: vi.fn(),
    };

    const mockStudentService = {
      handleStart: vi.fn(),
      handleHelp: vi.fn(),
      handleAccount: vi.fn(),
      handleCourses: vi.fn(),
      handleMyCourses: vi.fn(),
      handleProgress: vi.fn(),
      handlePayments: vi.fn(),
      handleCertificates: vi.fn(),
      handleNotifications: vi.fn(),
      handleSettings: vi.fn(),
      handleUnlink: vi.fn(),
    };

    const mockCheckoutService = {
      checkActiveSession: vi.fn().mockResolvedValue(false),
      handleStartEnrollment: vi.fn(),
      handlePromptPromo: vi.fn(),
      handlePromoInput: vi.fn(),
      handleSelectPaymentMethod: vi.fn(),
      handleChoosePaymentMethod: vi.fn(),
      handleReferenceInput: vi.fn(),
      handleReceiptUpload: vi.fn(),
      handleReviewPayment: vi.fn(),
      handleSubmitPayment: vi.fn(),
      handleCancelCheckout: vi.fn(),
    };

    updateService = new TelegramUpdateService(
      mockDatabase as any,
      clientService,
      configService,
      identityResolver,
      mockRegistrationService as any,
      linkService,
      mockStudentService as any,
      mockCheckoutService as any,
    );
    controller = new TelegramController(
      configService,
      updateService,
      linkService,
    );
  });

  it('TEST 2 — Authenticated user generates link token and gets deep-link URL', async () => {
    mockDatabase.client.query.users.findFirst.mockResolvedValue({
      id: 'user_canonical_25',
      status: 'ACTIVE',
    });
    mockDatabase.client.query.oauthAccounts.findFirst.mockResolvedValue(null);

    const result = await controller.createTelegramLink(mockUser);

    expect(result.alreadyLinked).toBe(false);
    expect(result.telegramUrl).toContain(
      'https://t.me/Joel_Talargie_Academy_Bot?start=',
    );
    expect(result.expiresAt).toBeDefined();
  });

  it('TEST 3 — Deep-link URL format does NOT contain @ symbol in hostname or path', () => {
    const url = configService.buildTelegramStartUrl('test-payload-123');
    expect(url).toBe(
      'https://t.me/Joel_Talargie_Academy_Bot?start=test-payload-123',
    );
    expect(url).not.toContain('t.me/@');
  });

  it('TEST 4 — Generated payload does NOT expose users.id, email, or JWT', async () => {
    mockDatabase.client.query.users.findFirst.mockResolvedValue({
      id: 'user_canonical_25',
      email: 'student@example.com',
      status: 'ACTIVE',
    });
    mockDatabase.client.query.oauthAccounts.findFirst.mockResolvedValue(null);

    const result = await linkService.generateLinkToken('user_canonical_25');
    const url = result.telegramUrl;

    expect(url).not.toContain('user_canonical_25');
    expect(url).not.toContain('student@example.com');
    expect(url).not.toContain('eyJ'); // JWT signature header prefix
  });

  it('TEST 5 & 6 — Valid /start <payload> links Telegram ID to users.id transactionally without creating new user', async () => {
    const rawToken = 'valid_raw_token_xyz';
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    mockDatabase.client.query.accountLinkTokens.findFirst.mockResolvedValue({
      id: 'token-rec-1',
      userId: 'user_canonical_25',
      purpose: TELEGRAM_LINK_PURPOSE,
      tokenHash,
      expiresAt: new Date(Date.now() + 100000),
      usedAt: null,
    });
    mockDatabase.client.query.oauthAccounts.findFirst.mockResolvedValue(null);

    const sendMessageSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 200,
      message: {
        message_id: 10,
        from: { id: 847362910, first_name: 'JoelStudent', username: 'joel_tg' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: `/start ${rawToken}`,
      },
    });

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining('Telegram Connected'),
      }),
    );
  });

  it('TEST 7 — Expired token is rejected safely with clear user message', async () => {
    const rawToken = 'expired_raw_token_xyz';
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    mockDatabase.client.query.accountLinkTokens.findFirst.mockResolvedValue({
      id: 'token-rec-2',
      userId: 'user_canonical_25',
      purpose: TELEGRAM_LINK_PURPOSE,
      tokenHash,
      expiresAt: new Date(Date.now() - 10000), // expired 10s ago
      usedAt: null,
    });

    const sendMessageSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 201,
      message: {
        message_id: 11,
        from: { id: 847362910, first_name: 'JoelStudent' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: `/start ${rawToken}`,
      },
    });

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining('This connection link has expired'),
      }),
    );
  });

  it('TEST 8 — Already used token is rejected on second attempt', async () => {
    const rawToken = 'reused_raw_token_xyz';
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    mockDatabase.client.query.accountLinkTokens.findFirst.mockResolvedValue({
      id: 'token-rec-3',
      userId: 'user_canonical_25',
      purpose: TELEGRAM_LINK_PURPOSE,
      tokenHash,
      expiresAt: new Date(Date.now() + 100000),
      usedAt: new Date(), // already used
    });

    const sendMessageSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 202,
      message: {
        message_id: 12,
        from: { id: 847362910, first_name: 'JoelStudent' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: `/start ${rawToken}`,
      },
    });

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining(
          'This connection link has already been used',
        ),
      }),
    );
  });

  it('TEST 9 — Invalid token payload is safely rejected', async () => {
    mockDatabase.client.query.accountLinkTokens.findFirst.mockResolvedValue(
      null,
    );

    const sendMessageSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 203,
      message: {
        message_id: 13,
        from: { id: 847362910, first_name: 'JoelStudent' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: '/start invalid_random_payload_123',
      },
    });

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining('This connection link is invalid'),
      }),
    );
  });

  it('TEST 10 — Telegram account already linked to another user is rejected', async () => {
    const rawToken = 'valid_token_other_user';
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    mockDatabase.client.query.accountLinkTokens.findFirst.mockResolvedValue({
      id: 'token-rec-4',
      userId: 'user_new_40',
      purpose: TELEGRAM_LINK_PURPOSE,
      tokenHash,
      expiresAt: new Date(Date.now() + 100000),
      usedAt: null,
    });

    // Telegram ID 847362910 is already linked to user_canonical_25
    mockDatabase.client.query.oauthAccounts.findFirst.mockResolvedValue({
      id: 'oauth-1',
      userId: 'user_canonical_25',
      provider: 'TELEGRAM',
      providerAccountId: '847362910',
    });

    const sendMessageSpy = vi
      .spyOn(clientService, 'sendMessage')
      .mockResolvedValue(true);

    await updateService.handleUpdate({
      update_id: 204,
      message: {
        message_id: 14,
        from: { id: 847362910, first_name: 'OtherUser' },
        chat: { id: 847362910, type: 'private' },
        date: Date.now(),
        text: `/start ${rawToken}`,
      },
    });

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining(
          'already connected to another academy account',
        ),
      }),
    );
  });

  it('TEST 14 & 15 — Frontend connection status API query', async () => {
    // Unconnected
    mockDatabase.client.query.oauthAccounts.findFirst.mockResolvedValue(null);
    const unlinkedStatus = await controller.getTelegramStatus(mockUser);
    expect(unlinkedStatus.connected).toBe(false);

    // Connected
    mockDatabase.client.query.oauthAccounts.findFirst.mockResolvedValue({
      id: 'oauth-1',
      userId: 'user_canonical_25',
      provider: 'TELEGRAM',
      providerAccountId: '847362910',
      providerEmail: 'joel_student_tg',
      linkedAt: new Date('2026-09-02T12:00:00Z'),
    });
    const linkedStatus = await controller.getTelegramStatus(mockUser);
    expect(linkedStatus.connected).toBe(true);
    expect(linkedStatus.username).toBe('joel_student_tg');
  });

  it('TEST 16 — Handles null Telegram username gracefully', async () => {
    mockDatabase.client.query.oauthAccounts.findFirst.mockResolvedValue({
      id: 'oauth-2',
      userId: 'user_canonical_25',
      provider: 'TELEGRAM',
      providerAccountId: '847362910',
      providerEmail: null,
      linkedAt: new Date('2026-09-02T12:00:00Z'),
    });
    const status = await controller.getTelegramStatus(mockUser);
    expect(status.connected).toBe(true);
    expect(status.username).toBeNull();
  });

  it('TEST 17 — Unlinks Telegram account successfully', async () => {
    mockDatabase.client.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'oauth-1' }]),
      }),
    });
    const result = await controller.unlinkTelegram(mockUser);
    expect(result.success).toBe(true);
  });

  it('TEST 18 — Throws NotFoundException when attempting to unlink unlinked account', async () => {
    mockDatabase.client.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });
    await expect(controller.unlinkTelegram(mockUser)).rejects.toThrow(
      'No linked Telegram account found to remove',
    );
  });
});
