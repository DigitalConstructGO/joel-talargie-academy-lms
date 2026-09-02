import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'node:crypto';
import {
  createTelegramStudentUser,
  deleteTelegramOnboardingState,
  findAuthUserByEmail,
  getTelegramOnboardingState,
  upsertTelegramOnboardingState,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { PasswordHasherService } from '../../../common/security/password-hasher.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { hashToken } from '../../auth/utils/token.util';
import { TelegramClientService } from './telegram-client.service';
import { TelegramConfigService } from './telegram-config.service';

export const MAX_OTP_ATTEMPTS = 5;
export const OTP_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
export const ONBOARDING_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// Exact same password pattern used by RegisterDto in web auth
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const first = local.charAt(0);
  return `${first}***@${domain}`;
}

@Injectable()
export class TelegramRegistrationService {
  private readonly logger = new Logger(TelegramRegistrationService.name);

  // Transient in-memory password store (never persisted to DB)
  private readonly transientPasswords = new Map<number, string>();

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(TelegramClientService)
    private readonly telegramClient: TelegramClientService,
    @Inject(TelegramConfigService)
    private readonly telegramConfig: TelegramConfigService,
    @Inject(PasswordHasherService)
    private readonly passwords: PasswordHasherService,
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
  ) {}

  async startRegistration(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    const existingState = await getTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    // Check for incomplete / unfinished registration (Resume Rule)
    if (existingState && existingState.email) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `📝 **Unfinished Registration Session**\n\n` +
          `You have an unfinished registration for:\n` +
          `**${maskEmail(existingState.email)}**\n\n` +
          `Would you like to continue or start over?`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Continue Registration',
                callback_data: 'continue_registration',
              },
              { text: 'Pause', callback_data: 'pause_registration' },
            ],
            [
              { text: 'Start Over', callback_data: 'start_over' },
              { text: 'Cancel', callback_data: 'cancel_registration' },
            ],
          ],
        },
      });
      return;
    }

    const expiresAt = new Date(Date.now() + ONBOARDING_EXPIRATION_MS);

    await upsertTelegramOnboardingState(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_EMAIL',
      expiresAt,
    });

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `📝 **Create your Joel Academy Account**\n\n` +
        `Please enter your real email address.\n` +
        `We will send a 6-digit verification code to confirm your email.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Cancel', callback_data: 'cancel_registration' }],
        ],
      },
    });
  }

  async submitEmail(
    chatId: number,
    telegramUserId: number,
    rawEmail: string,
    telegramUsername?: string,
  ): Promise<void> {
    const email = rawEmail.trim().toLowerCase();

    // 1. Email format validation
    const emailRegex = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
    if (!emailRegex.test(email)) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `⚠️ That email address does not look valid.\n\n` +
          `Please enter a valid email address (e.g. name@example.com).`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
      return;
    }

    // 2. Existing email check
    const existing = await findAuthUserByEmail(this.database.client, email);
    if (existing) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `⚠️ An academy account already exists for this email.\n\n` +
          `Choose "Connect Existing Account" to connect this Telegram account to your profile.`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Connect Existing Account',
                callback_data: 'connect_existing',
              },
            ],
            [{ text: 'Use Different Email', callback_data: 'change_email' }],
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
      return;
    }

    // 3. Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashToken(otpCode);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);
    const expiresAt = new Date(Date.now() + ONBOARDING_EXPIRATION_MS);

    await upsertTelegramOnboardingState(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_OTP',
      email,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      resendCount: 0,
      lastResendAt: new Date(),
      expiresAt,
    });

    // 4. Send real email OTP using TELEGRAM_REGISTRATION_OTP template
    try {
      await this.notifications.notify({
        userId: 'system_registration',
        recipientEmail: email,
        recipientName: 'Student',
        templateCode: 'TELEGRAM_REGISTRATION_OTP',
        variables: {
          recipientName: 'Student',
          otpCode: otpCode,
          expiresInMinutes: '15',
          academyName: 'Joel Talargie Academy',
          supportEmail: 'support@joelacademy.com',
        },
        deduplicationKey: `telegram-reg-otp:${telegramUserId}:${Date.now()}`,
        category: 'security',
        title: 'Verify your email for Joel Talargie Academy',
        message: `Your 6-digit verification code is: ${otpCode}. It expires in 15 minutes.`,
        actionUrl: '/auth/verify-email',
        priority: 'HIGH',
      });
    } catch (mailError) {
      this.logger.error('Failed to send registration OTP email:', mailError);
    }

    // 5. Telegram response
    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `✉️ We sent a 6-digit verification code to:\n` +
        `**${maskEmail(email)}**\n\n` +
        `Please enter the 6-digit code below.`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Resend Code', callback_data: 'resend_otp' },
            { text: 'Change Email', callback_data: 'change_email' },
          ],
          [{ text: 'Pause', callback_data: 'pause_registration' }],
          [{ text: 'Cancel', callback_data: 'cancel_registration' }],
        ],
      },
    });
  }

  async submitOtp(
    chatId: number,
    telegramUserId: number,
    rawOtp: string,
  ): Promise<void> {
    const state = await getTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    if (
      !state ||
      state.step !== 'AWAITING_OTP' ||
      !state.email ||
      !state.otpHash
    ) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `⚠️ Your registration session has expired.\n\n` +
          `Please tap "Create New Account" to start again.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Create New Account', callback_data: 'register_new' }],
          ],
        },
      });
      return;
    }

    // Check OTP expiration
    if (state.otpExpiresAt && new Date() > new Date(state.otpExpiresAt)) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `⏱️ The 6-digit verification code has expired.\n\n` +
          `Tap "Resend Code" to receive a new verification code.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Resend Code', callback_data: 'resend_otp' }],
            [{ text: 'Change Email', callback_data: 'change_email' }],
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
      return;
    }

    // Check attempt limits (5 attempts max)
    if (state.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await deleteTelegramOnboardingState(
        this.database.client,
        String(telegramUserId),
      );
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `⛔ Maximum verification attempts exceeded (5/5).\n\n` +
          `Your registration attempt has been reset for security. Please start again.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Create New Account', callback_data: 'register_new' }],
          ],
        },
      });
      return;
    }

    // Verify OTP hash
    const inputHash = hashToken(rawOtp.trim());
    if (inputHash !== state.otpHash) {
      const newAttempts = state.otpAttempts + 1;
      const remaining = MAX_OTP_ATTEMPTS - newAttempts;

      await upsertTelegramOnboardingState(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'AWAITING_OTP',
        email: state.email,
        otpHash: state.otpHash,
        otpExpiresAt: state.otpExpiresAt,
        otpAttempts: newAttempts,
        resendCount: state.resendCount,
        lastResendAt: state.lastResendAt,
        expiresAt: state.expiresAt,
      });

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `❌ Incorrect verification code (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).\n\n` +
          `Please check your email (**${maskEmail(state.email)}**) and enter the correct 6-digit code.`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Resend Code', callback_data: 'resend_otp' },
              { text: 'Change Email', callback_data: 'change_email' },
            ],
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
      return;
    }

    // OTP Verified! Advance state to EMAIL_VERIFIED / AWAITING_PASSWORD
    await upsertTelegramOnboardingState(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_PASSWORD',
      email: state.email,
      emailVerifiedAt: new Date(),
      expiresAt: new Date(Date.now() + ONBOARDING_EXPIRATION_MS),
    });

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `✅ **Email Verified Successfully!**\n\n` +
        `🔒 **Step 2/2: Create Your Password**\n\n` +
        `Please create a password for your Joel Talargie Academy account.\n` +
        `Your password will allow you to log in to the academy website.\n\n` +
        `**Requirements:**\n` +
        `• At least 8 characters\n` +
        `• 1 uppercase letter\n` +
        `• 1 lowercase letter\n` +
        `• 1 number\n` +
        `• 1 special character\n\n` +
        `Please type your password below.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Pause', callback_data: 'pause_registration' }],
          [{ text: 'Cancel', callback_data: 'cancel_registration' }],
        ],
      },
    });
  }

  async submitPassword(
    chatId: number,
    telegramUserId: number,
    passwordInput: string,
    messageId?: number,
  ): Promise<void> {
    // Privacy protection: delete sensitive password message from Telegram chat if API allows
    if (messageId) {
      void this.telegramClient
        .deleteMessage(chatId, messageId)
        .catch(() => null);
    }

    const state = await getTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    if (
      !state ||
      (state.step !== 'AWAITING_PASSWORD' &&
        state.step !== 'AWAITING_PASSWORD_CONFIRMATION')
    ) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `⚠️ Registration session unavailable. Tap "Create New Account" to start.`,
      });
      return;
    }

    // Password validation using standard passwordPattern
    const pwd = passwordInput.trim();
    if (!passwordPattern.test(pwd)) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `❌ **Password does not meet security requirements.**\n\n` +
          `Must contain:\n` +
          `• Minimum 8 characters\n` +
          `• 1 uppercase letter (A-Z)\n` +
          `• 1 lowercase letter (a-z)\n` +
          `• 1 number (0-9)\n` +
          `• 1 special character (!@#$%^&*...)\n\n` +
          `Please enter a stronger password.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
      return;
    }

    // Save valid password in transient in-memory map ONLY
    this.transientPasswords.set(telegramUserId, pwd);

    await upsertTelegramOnboardingState(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_PASSWORD_CONFIRMATION',
      email: state.email,
      emailVerifiedAt: state.emailVerifiedAt,
      expiresAt: new Date(Date.now() + ONBOARDING_EXPIRATION_MS),
    });

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `🔒 **Confirm Your Password**\n\n` +
        `Please re-enter your password to confirm.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Cancel', callback_data: 'cancel_registration' }],
        ],
      },
    });
  }

  async submitPasswordConfirmation(
    chatId: number,
    telegramUserId: number,
    confirmInput: string,
    messageId?: number,
    firstName?: string,
    lastName?: string,
    telegramUsername?: string,
  ): Promise<void> {
    // Privacy protection: delete sensitive confirmation message from Telegram chat if API allows
    if (messageId) {
      void this.telegramClient
        .deleteMessage(chatId, messageId)
        .catch(() => null);
    }

    const state = await getTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    if (
      !state ||
      state.step !== 'AWAITING_PASSWORD_CONFIRMATION' ||
      !state.email
    ) {
      this.transientPasswords.delete(telegramUserId);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `⚠️ Session expired. Tap "Create New Account" to start.`,
      });
      return;
    }

    const storedPassword = this.transientPasswords.get(telegramUserId);
    const confirmPwd = confirmInput.trim();

    if (!storedPassword || confirmPwd !== storedPassword) {
      // Password mismatch: clear transient password and reset step to AWAITING_PASSWORD
      this.transientPasswords.delete(telegramUserId);

      await upsertTelegramOnboardingState(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'AWAITING_PASSWORD',
        email: state.email,
        emailVerifiedAt: state.emailVerifiedAt,
        expiresAt: new Date(Date.now() + ONBOARDING_EXPIRATION_MS),
      });

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `❌ **Passwords do not match.**\n\n` +
          `Please enter your password again.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
      return;
    }

    // Passwords Match! Execute transactional account creation
    try {
      const passwordHash = await this.passwords.hashPassword(storedPassword);
      this.transientPasswords.delete(telegramUserId); // Destroy transient memory immediately

      const user = await createTelegramStudentUser(this.database.client, {
        email: state.email,
        passwordHash,
        firstName: firstName || 'Student',
        lastName: lastName || '',
        telegramUserId: String(telegramUserId),
        telegramUsername,
      });

      this.logger.log(
        `Full Telegram registration complete for user ID ${user.id} (${state.email}) from Telegram ID ${telegramUserId}`,
      );

      // Send welcome notification
      try {
        await this.notifications.notify({
          userId: user.id,
          recipientEmail: user.email,
          recipientName: `${user.firstName} ${user.lastName}`.trim(),
          templateCode: 'WELCOME',
          variables: {
            recipientName: user.firstName,
            dashboardUrl: `${this.telegramConfig.webAppUrl}/dashboard`,
            academyName: 'Joel Talargie Academy',
            supportEmail: 'support@joelacademy.com',
          },
          deduplicationKey: `welcome:${user.id}`,
          category: 'learning',
          title: 'Welcome to Joel Talargie Academy!',
          message: 'Your account is ready. Start exploring courses today.',
          actionUrl: '/dashboard',
          priority: 'NORMAL',
        });
      } catch (welcomeErr) {
        this.logger.warn('Failed to send welcome email:', welcomeErr);
      }

      // Telegram success response
      const dashboardReturnUrl = `${this.telegramConfig.webAppUrl}/dashboard`;
      const hasValidHttpsUrl = dashboardReturnUrl.startsWith('https://');

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `🎉 **Account Created Successfully!**\n\n` +
          `Welcome to Joel Talargie Academy!\n` +
          `Your email has been verified and your student account is ready.\n\n` +
          `📧 **Email:** ${user.email}\n` +
          `🔑 **Password:** Set (use this to log in on the website)\n` +
          `🎓 **Role:** Student\n` +
          `📱 **Telegram:** Connected\n\n` +
          `You can now use your email and password to log in on the academy website.`,
        ...(hasValidHttpsUrl
          ? {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Open Academy', url: dashboardReturnUrl }],
                ],
              },
            }
          : {}),
      });
    } catch (error: any) {
      this.transientPasswords.delete(telegramUserId);
      this.logger.error(
        `Failed to create Telegram student account for ${state.email}:`,
        error,
      );

      if (error?.message === 'EMAIL_ALREADY_EXISTS') {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `⚠️ An academy account with this email was just registered.\n\n` +
            `Please connect your existing account.`,
        });
        return;
      }

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `An error occurred while creating your account. Please try again.`,
      });
    }
  }

  async resendOtp(chatId: number, telegramUserId: number): Promise<void> {
    const state = await getTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    if (!state || !state.email) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `No active registration session found. Tap "Create New Account" to start.`,
      });
      return;
    }

    // Cooldown check (60s)
    if (
      state.lastResendAt &&
      Date.now() - new Date(state.lastResendAt).getTime() < RESEND_COOLDOWN_MS
    ) {
      const waitSec = Math.ceil(
        (RESEND_COOLDOWN_MS -
          (Date.now() - new Date(state.lastResendAt).getTime())) /
          1000,
      );
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `⏳ Please wait ${waitSec} second${waitSec === 1 ? '' : 's'} before requesting another verification code.`,
      });
      return;
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashToken(otpCode);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

    await upsertTelegramOnboardingState(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_OTP',
      email: state.email,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      resendCount: state.resendCount + 1,
      lastResendAt: new Date(),
      expiresAt: new Date(Date.now() + ONBOARDING_EXPIRATION_MS),
    });

    try {
      await this.notifications.notify({
        userId: 'system_registration',
        recipientEmail: state.email,
        recipientName: 'Student',
        templateCode: 'TELEGRAM_REGISTRATION_OTP',
        variables: {
          recipientName: 'Student',
          otpCode: otpCode,
          expiresInMinutes: '15',
          academyName: 'Joel Talargie Academy',
          supportEmail: 'support@joelacademy.com',
        },
        deduplicationKey: `telegram-reg-otp:${telegramUserId}:${Date.now()}`,
        category: 'security',
        title: 'Verify your email for Joel Talargie Academy',
        message: `Your new 6-digit verification code is: ${otpCode}. It expires in 15 minutes.`,
        actionUrl: '/auth/verify-email',
        priority: 'HIGH',
      });
    } catch (mailError) {
      this.logger.error('Failed to resend registration OTP email:', mailError);
    }

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `🔄 A new 6-digit verification code was sent to:\n` +
        `**${maskEmail(state.email)}**\n\n` +
        `Please enter the new 6-digit code below.`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Resend Code', callback_data: 'resend_otp' },
            { text: 'Change Email', callback_data: 'change_email' },
          ],
          [{ text: 'Pause', callback_data: 'pause_registration' }],
          [{ text: 'Cancel', callback_data: 'cancel_registration' }],
        ],
      },
    });
  }

  async pauseRegistration(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    this.transientPasswords.delete(telegramUserId);

    const state = await getTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    if (state && state.email) {
      await upsertTelegramOnboardingState(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'PAUSED',
        email: state.email,
        emailVerifiedAt: state.emailVerifiedAt,
        pausedAt: new Date(),
        expiresAt: new Date(Date.now() + ONBOARDING_EXPIRATION_MS),
      });
    }

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `⏸️ **Registration Paused**\n\n` +
        `Your progress has been saved. You can resume anytime by sending /start.`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Resume Registration',
              callback_data: 'continue_registration',
            },
          ],
          [{ text: 'Cancel', callback_data: 'cancel_registration' }],
        ],
      },
    });
  }

  async resumeRegistration(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    const state = await getTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    if (!state || !state.email) {
      await this.startRegistration(chatId, telegramUserId);
      return;
    }

    // Resume based on current step
    if (state.step === 'AWAITING_EMAIL') {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Please enter your real email address to continue.`,
      });
      return;
    }

    if (state.step === 'AWAITING_OTP') {
      // Check if OTP has expired
      if (state.otpExpiresAt && new Date() > new Date(state.otpExpiresAt)) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `⏱️ Your verification code for **${maskEmail(state.email)}** has expired.\n\n` +
            `Tap "Send New Code" to receive a new code.`,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Send New Code', callback_data: 'resend_otp' }],
              [{ text: 'Change Email', callback_data: 'change_email' }],
              [{ text: 'Cancel', callback_data: 'cancel_registration' }],
            ],
          },
        });
        return;
      }

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `✉️ Please enter the 6-digit verification code sent to:\n` +
          `**${maskEmail(state.email)}**`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Resend Code', callback_data: 'resend_otp' },
              { text: 'Change Email', callback_data: 'change_email' },
            ],
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
      return;
    }

    if (
      state.step === 'EMAIL_VERIFIED' ||
      state.step === 'AWAITING_PASSWORD' ||
      state.step === 'AWAITING_PASSWORD_CONFIRMATION' ||
      state.step === 'PAUSED'
    ) {
      // If email was already verified, resume from password creation
      await upsertTelegramOnboardingState(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'AWAITING_PASSWORD',
        email: state.email,
        emailVerifiedAt: state.emailVerifiedAt,
        expiresAt: new Date(Date.now() + ONBOARDING_EXPIRATION_MS),
      });

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `✅ Email **${maskEmail(state.email)}** is verified!\n\n` +
          `🔒 **Create Your Password**\n\n` +
          `Please enter a password for your account (min 8 chars, 1 upper, 1 lower, 1 number, 1 special char).`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Cancel', callback_data: 'cancel_registration' }],
          ],
        },
      });
    }
  }

  async changeEmail(chatId: number, telegramUserId: number): Promise<void> {
    this.transientPasswords.delete(telegramUserId);

    await upsertTelegramOnboardingState(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_EMAIL',
      expiresAt: new Date(Date.now() + ONBOARDING_EXPIRATION_MS),
    });

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: `Please enter your new email address.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Cancel', callback_data: 'cancel_registration' }],
        ],
      },
    });
  }

  async cancelRegistration(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    this.transientPasswords.delete(telegramUserId);

    await deleteTelegramOnboardingState(
      this.database.client,
      String(telegramUserId),
    );

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `Welcome to Joel Talargie Academy 👋\n\n` +
        `Your Telegram account is not connected yet.\n` +
        `Choose an option:`,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Create New Account', callback_data: 'register_new' }],
          [
            {
              text: 'Connect Existing Account',
              callback_data: 'connect_existing',
            },
          ],
        ],
      },
    });
  }
}
