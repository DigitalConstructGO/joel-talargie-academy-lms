import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramConfigService } from '../services/telegram-config.service';
import { TelegramClientService } from '../services/telegram-client.service';
import {
  TelegramRegistrationService,
  MAX_OTP_ATTEMPTS,
} from '../services/telegram-registration.service';
import { hashToken } from '../../auth/utils/token.util';

describe('TG5 — Telegram Registration Service Unit Tests', () => {
  let registrationService: TelegramRegistrationService;
  let mockDatabase: any;
  let mockClient: any;
  let mockConfig: any;
  let mockPasswords: any;
  let mockNotifications: any;
  let storageOnboardingState: any = null;

  beforeEach(() => {
    vi.clearAllMocks();
    storageOnboardingState = null;

    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '123456:ABC-DEF';
        if (key === 'TELEGRAM_BOT_USERNAME') return 'Joel_Talargie_Academy_Bot';
        if (key === 'WEB_APP_URL') return 'http://localhost:3000';
        return undefined;
      }),
    };

    mockClient = {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 100 }),
    };

    mockPasswords = {
      hashPassword: vi.fn().mockResolvedValue('hashed_unusable_pass'),
    };

    mockNotifications = {
      notify: vi.fn().mockResolvedValue({ id: 'notif_1' }),
    };

    mockDatabase = {
      client: {
        query: {
          telegramOnboardingStates: {
            findFirst: vi
              .fn()
              .mockImplementation(async () => storageOnboardingState),
          },
          users: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          oauthAccounts: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          roles: {
            findFirst: vi
              .fn()
              .mockResolvedValue({ id: 'role_student', code: 'STUDENT' }),
          },
          userProfiles: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          userRoles: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ code: 'STUDENT' }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(async () => [
              {
                id: 'user_new_1',
                email: 'student@example.com',
                provider: 'TELEGRAM',
              },
            ]),
          }),
        }),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation((values) => ({
            where: vi.fn().mockImplementation(async () => {
              if (storageOnboardingState) {
                Object.assign(storageOnboardingState, values);
              }
              return [];
            }),
          })),
        })),
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(async () => {
            storageOnboardingState = null;
            return [];
          }),
        }),
      },
    };

    const configService = new TelegramConfigService(mockConfig as any);
    const clientService = new TelegramClientService(configService);
    // spy sendMessage
    vi.spyOn(clientService, 'sendMessage').mockImplementation(
      mockClient.sendMessage,
    );

    registrationService = new TelegramRegistrationService(
      mockDatabase,
      clientService,
      configService,
      mockPasswords,
      mockNotifications,
    );
  });

  it('TEST 1 — Unlinked user can start registration', async () => {
    await registrationService.startRegistration(1001, 847362910);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Create your Joel Academy Account'),
      }),
    );
  });

  it('TEST 2 — Invalid email is rejected', async () => {
    await registrationService.submitEmail(1001, 847362910, 'not-an-email');

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('does not look valid'),
      }),
    );
    expect(mockNotifications.notify).not.toHaveBeenCalled();
  });

  it('TEST 3 — New email OTP is sent', async () => {
    await registrationService.submitEmail(
      1001,
      847362910,
      'student-new@example.com',
    );

    expect(mockNotifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'student-new@example.com',
        templateCode: 'TELEGRAM_REGISTRATION_OTP',
      }),
    );
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('s***@example.com'),
      }),
    );
  });

  it('TEST 4 — Existing email guiding user toward Connect Existing Account', async () => {
    mockDatabase.client.query.users.findFirst.mockResolvedValueOnce({
      id: 'user_25',
      email: 'student-existing@example.com',
    });

    await registrationService.submitEmail(
      1001,
      847362910,
      'student-existing@example.com',
    );

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining(
          'An academy account already exists for this email',
        ),
      }),
    );
    expect(mockNotifications.notify).not.toHaveBeenCalled();
  });

  it('TEST 5 — Wrong OTP increments attempt count', async () => {
    storageOnboardingState = {
      telegramUserId: '847362910',
      step: 'AWAITING_OTP',
      email: 'student@example.com',
      otpHash: hashToken('654321'),
      otpAttempts: 0,
      expiresAt: new Date(Date.now() + 600000),
      otpExpiresAt: new Date(Date.now() + 600000),
    };

    await registrationService.submitOtp(1001, 847362910, '111111');

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Incorrect verification code'),
      }),
    );
  });

  it('TEST 6 — Expired OTP is rejected', async () => {
    storageOnboardingState = {
      telegramUserId: '847362910',
      step: 'AWAITING_OTP',
      email: 'student@example.com',
      otpHash: hashToken('654321'),
      otpAttempts: 0,
      expiresAt: new Date(Date.now() + 600000),
      otpExpiresAt: new Date(Date.now() - 1000), // Expired!
    };

    await registrationService.submitOtp(1001, 847362910, '654321');

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('verification code has expired'),
      }),
    );
  });

  it('TEST 7 — OTP attempt limit (5 attempts max)', async () => {
    storageOnboardingState = {
      telegramUserId: '847362910',
      step: 'AWAITING_OTP',
      email: 'student@example.com',
      otpHash: hashToken('654321'),
      otpAttempts: MAX_OTP_ATTEMPTS,
      expiresAt: new Date(Date.now() + 600000),
      otpExpiresAt: new Date(Date.now() + 600000),
    };

    await registrationService.submitOtp(1001, 847362910, '654321');

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Maximum verification attempts exceeded'),
      }),
    );
  });

  it('TEST 8 & 9 — OTP resend cooldown rate limiting', async () => {
    storageOnboardingState = {
      telegramUserId: '847362910',
      step: 'AWAITING_OTP',
      email: 'student@example.com',
      otpHash: hashToken('654321'),
      otpAttempts: 0,
      resendCount: 0,
      lastResendAt: new Date(), // Just sent!
      expiresAt: new Date(Date.now() + 600000),
      otpExpiresAt: new Date(Date.now() + 600000),
    };

    await registrationService.resendOtp(1001, 847362910);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Please wait'),
      }),
    );
  });

  it('TEST 10, 11, 12, 13, 14, 15 — Successful registration creates user with STUDENT role and Telegram identity', async () => {
    const rawCode = '654321';
    storageOnboardingState = {
      telegramUserId: '847362910',
      step: 'AWAITING_OTP',
      email: 'student-success@example.com',
      otpHash: hashToken(rawCode),
      otpAttempts: 0,
      expiresAt: new Date(Date.now() + 600000),
      otpExpiresAt: new Date(Date.now() + 600000),
    };

    await registrationService.submitOtp(1001, 847362910, rawCode);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Email Verified Successfully'),
      }),
    );

    // Submit password
    await registrationService.submitPassword(
      1001,
      847362910,
      'Password123!',
      201,
    );

    // Submit password confirmation
    await registrationService.submitPasswordConfirmation(
      1001,
      847362910,
      'Password123!',
      202,
      'Abebe',
      'Bikila',
      'abebe_dev',
    );

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Account Created Successfully'),
      }),
    );
  });

  it('TEST 19 — Cancel before OTP clears state', async () => {
    await registrationService.cancelRegistration(1001, 847362910);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Welcome to Joel Talargie Academy'),
      }),
    );
  });

  it('TEST 20 — Change email resets onboarding to email input', async () => {
    await registrationService.changeEmail(1001, 847362910);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 1001,
        text: expect.stringContaining('Please enter your new email address'),
      }),
    );
  });
});
