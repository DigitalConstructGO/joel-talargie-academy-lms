import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'node:crypto';
import {
  consumeAccountLinkToken,
  findAuthUserByEmail,
  getTelegramOnboardingState,
  getTelegramCheckoutSession,
  upsertTelegramCheckoutSession,
  linkTelegramAccount,
  schema,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { TelegramClientService } from './telegram-client.service';
import { TelegramConfigService } from './telegram-config.service';
import { TelegramIdentityResolverService } from './telegram-identity-resolver.service';
import {
  TelegramLinkService,
  TELEGRAM_LINK_PURPOSE,
} from './telegram-link.service';
import { TelegramRegistrationService } from './telegram-registration.service';
import { TelegramStudentService } from './telegram-student.service';
import { TelegramCheckoutService } from './telegram-checkout.service';
import type { TelegramUpdate } from '../dto/telegram-update.dto';

@Injectable()
export class TelegramUpdateService {
  private readonly logger = new Logger(TelegramUpdateService.name);

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(TelegramClientService)
    private readonly telegramClient: TelegramClientService,
    @Inject(TelegramConfigService)
    private readonly telegramConfig: TelegramConfigService,
    @Inject(TelegramIdentityResolverService)
    private readonly identityResolver: TelegramIdentityResolverService,
    @Inject(TelegramRegistrationService)
    private readonly registrationService: TelegramRegistrationService,
    @Inject(TelegramLinkService)
    private readonly linkService: TelegramLinkService,
    @Inject(TelegramStudentService)
    private readonly studentService: TelegramStudentService,
    @Inject(TelegramCheckoutService)
    private readonly checkoutService: TelegramCheckoutService,
  ) {}

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (!update) return;

    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.edited_message) {
        await this.handleMessage(update.edited_message);
      } else if (update.my_chat_member) {
        this.logger.log(
          `Bot status updated for Telegram user ${update.my_chat_member.from.id}`,
        );
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else {
        this.logger.debug(
          `Ignored unhandled update type ID ${update.update_id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing update ID ${update?.update_id}:`,
        error,
      );
    }
  }

  private async handleCallbackQuery(
    cb: NonNullable<TelegramUpdate['callback_query']>,
  ): Promise<void> {
    const fromId = cb.from?.id;
    const chatId = cb.message?.chat?.id || fromId;
    const data = cb.data;

    if (!fromId || !chatId || !data) return;

    this.logger.log(
      `Received callback query '${data}' from Telegram user ${fromId}`,
    );

    if (data === 'register_new') {
      await this.registrationService.startRegistration(chatId, fromId);
    } else if (data === 'connect_existing') {
      await this.registrationService.startExistingAccountConnection(
        chatId,
        fromId,
      );
    } else if (data === 'continue_web') {
      const resolution = await this.identityResolver.resolveIdentity(fromId);
      if (resolution.status === 'LINKED' && resolution.user) {
        const rawToken = await this.linkService.generateContinuationToken(
          resolution.user.id,
        );
        const continueUrl = `${this.telegramConfig.webAppUrl}/auth/telegram/continue?token=${rawToken}`;
        const isHttps = continueUrl.startsWith('https://');

        if (isHttps) {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text:
              `🌐 **Secure Website Continuation**\n\n` +
              `Tap the button below to log in securely to the website with your account.`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Open Website Dashboard', url: continueUrl }],
              ],
            },
          });
        } else {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text:
              `🌐 **Secure Website Continuation**\n\n` +
              `Click the link below to log in securely to the website:\n\n` +
              `${continueUrl}`,
          });
        }
      } else {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `Please connect your Telegram account first to continue on the website.`,
        });
      }
    } else if (data === 'continue_registration') {
      await this.registrationService.resumeRegistration(chatId, fromId);
    } else if (data === 'pause_registration') {
      await this.registrationService.pauseRegistration(chatId, fromId);
    } else if (data === 'start_over') {
      await this.registrationService.startRegistration(chatId, fromId);
    } else if (data === 'resend_otp') {
      await this.registrationService.resendOtp(chatId, fromId);
    } else if (data === 'change_email') {
      await this.registrationService.changeEmail(chatId, fromId);
    } else if (data === 'cancel_registration') {
      await this.registrationService.cancelRegistration(chatId, fromId);
    } else if (data === 'student_menu') {
      await this.studentService.handleStart(chatId, fromId);
    } else if (data === 'student_help') {
      await this.studentService.handleHelp(chatId, fromId);
    } else if (data === 'prompt_language') {
      await this.studentService.handlePromptLanguage(chatId, fromId);
    } else if (data === 'set_lang:en') {
      await this.studentService.handleSetLanguage(chatId, fromId, 'en');
    } else if (data === 'set_lang:am') {
      await this.studentService.handleSetLanguage(chatId, fromId, 'am');
    } else if (data === 'student_account') {
      await this.studentService.handleAccount(chatId, fromId);
    } else if (data === 'student_courses') {
      await this.studentService.handleCourses(chatId, 1);
    } else if (data.startsWith('courses_page:')) {
      const page = parseInt(data.split(':')[1] || '1', 10);
      await this.studentService.handleCourses(chatId, isNaN(page) ? 1 : page);
    } else if (data.startsWith('course_detail:')) {
      const courseId = data.split(':')[1];
      await this.studentService.handleCourseDetail(chatId, fromId, courseId);
    } else if (
      data.startsWith('start_enrollment:') ||
      data.startsWith('resume_checkout:')
    ) {
      const courseId = data.split(':')[1];
      await this.checkoutService.handleStartEnrollment(
        chatId,
        fromId,
        courseId,
      );
    } else if (data === 'prompt_promo_code') {
      await this.checkoutService.handlePromptPromo(chatId, fromId);
    } else if (
      data === 'skip_promo_code' ||
      data === 'continue_to_payment_methods'
    ) {
      await this.checkoutService.handleSelectPaymentMethod(chatId, fromId);
    } else if (data.startsWith('choose_payment_method:')) {
      const methodId = data.split(':')[1];
      await this.checkoutService.handleChoosePaymentMethod(
        chatId,
        fromId,
        methodId,
      );
    } else if (data === 'submit_final_payment') {
      await this.checkoutService.handleSubmitPayment(chatId, fromId);
    } else if (data.startsWith('confirm_free_enrollment:')) {
      await this.checkoutService.handleSubmitPayment(chatId, fromId);
    } else if (data === 'cancel_checkout') {
      await this.checkoutService.handleCancelCheckout(chatId, fromId);
    } else if (data === 'prompt_course_search') {
      await upsertTelegramCheckoutSession(this.database.client, {
        telegramUserId: String(fromId),
        step: 'AWAITING_SEARCH_QUERY',
      });
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `🔎 <b>Course Search</b>\n\nPlease type and send your course keyword or title in chat:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Back to Courses', callback_data: 'student_courses' }],
          ],
        },
      });
    } else if (data === 'prompt_course_filters') {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `🎯 <b>Filter Courses</b>\n\nSelect a course type filter below:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'All Courses', callback_data: 'filter_courses:ALL' }],
            [{ text: '🆓 FREE Courses', callback_data: 'filter_courses:FREE' }],
            [{ text: '💳 PAID Courses', callback_data: 'filter_courses:PAID' }],
            [{ text: '⬅️ Back to Courses', callback_data: 'student_courses' }],
          ],
        },
      });
    } else if (data.startsWith('filter_courses:')) {
      const fType = data.split(':')[1];
      await this.studentService.handleCourses(
        chatId,
        1,
        null,
        fType === 'ALL' ? null : fType,
      );
    } else if (data === 'clear_course_search') {
      await this.studentService.handleCourses(chatId, 1, null, null);
    } else if (data === 'student_my_courses') {
      await this.studentService.handleMyCourses(chatId, fromId, 1);
    } else if (data.startsWith('mycourses_page:')) {
      const page = parseInt(data.split(':')[1] || '1', 10);
      await this.studentService.handleMyCourses(
        chatId,
        fromId,
        isNaN(page) ? 1 : page,
      );
    } else if (data.startsWith('course_curriculum:')) {
      const enrollmentId = data.split(':')[1];
      await this.studentService.handleCourseCurriculum(
        chatId,
        fromId,
        enrollmentId,
      );
    } else if (data.startsWith('view_lesson:')) {
      const parts = data.split(':');
      const lessonId = parts.length > 2 ? parts[2] : parts[1];
      const enrollmentId = parts.length > 2 ? parts[1] : null;
      await this.studentService.handleLessonDetail(
        chatId,
        fromId,
        enrollmentId,
        lessonId,
      );
    } else if (data.startsWith('complete_lesson:')) {
      const parts = data.split(':');
      const lessonId = parts.length > 2 ? parts[2] : parts[1];
      const enrollmentId = parts.length > 2 ? parts[1] : null;
      await this.studentService.handleCompleteLesson(
        chatId,
        fromId,
        enrollmentId,
        lessonId,
      );
    } else if (data === 'student_progress') {
      await this.studentService.handleProgress(chatId, fromId);
    } else if (data.startsWith('progress_detail:')) {
      await this.studentService.handleProgress(chatId, fromId);
    } else if (data === 'student_payments') {
      await this.studentService.handlePayments(chatId, fromId, 1);
    } else if (data.startsWith('payments_page:')) {
      const page = parseInt(data.split(':')[1] || '1', 10);
      await this.studentService.handlePayments(
        chatId,
        fromId,
        isNaN(page) ? 1 : page,
      );
    } else if (data.startsWith('payment_detail:')) {
      const paymentId = data.split(':')[1];
      await this.studentService.handlePayments(chatId, fromId, 1, paymentId);
    } else if (data === 'student_certificates') {
      await this.studentService.handleCertificates(chatId, fromId, 1);
    } else if (data.startsWith('certificates_page:')) {
      const page = parseInt(data.split(':')[1] || '1', 10);
      await this.studentService.handleCertificates(
        chatId,
        fromId,
        isNaN(page) ? 1 : page,
      );
    } else if (data.startsWith('cert_detail:')) {
      const certId = data.split(':')[1];
      await this.studentService.handleCertificates(chatId, fromId, 1, certId);
    } else if (data === 'student_notifications') {
      await this.studentService.handleNotifications(chatId, fromId, 1);
    } else if (data.startsWith('notifications_page:')) {
      const page = parseInt(data.split(':')[1] || '1', 10);
      await this.studentService.handleNotifications(
        chatId,
        fromId,
        isNaN(page) ? 1 : page,
      );
    } else if (data === 'student_settings') {
      await this.studentService.handleSettings(chatId, fromId);
    } else if (data === 'student_unlink') {
      await this.studentService.handleUnlink(chatId, fromId);
    }
  }

  private async handleMessage(
    message: NonNullable<TelegramUpdate['message']>,
  ): Promise<void> {
    const fromUser = message.from;
    if (!fromUser || !fromUser.id) {
      this.logger.debug('Message update ignored: missing valid sender from.id');
      return;
    }

    const text = message.text?.trim() || '';
    const chatId = message.chat.id;

    if (text.startsWith('/start')) {
      await this.handleStartCommand({
        chatId,
        telegramUserId: fromUser.id,
        telegramUsername: fromUser.username,
        firstName: fromUser.first_name,
        fullText: text,
      });
      return;
    }

    if (text.startsWith('/help')) {
      await this.studentService.handleHelp(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/language') || text.startsWith('/lang')) {
      await this.studentService.handlePromptLanguage(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/account')) {
      await this.studentService.handleAccount(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/courses') || text.startsWith('/course')) {
      await this.studentService.handleCourses(chatId, 1);
      return;
    }

    if (text.startsWith('/mycourses')) {
      await this.studentService.handleMyCourses(chatId, fromUser.id, 1);
      return;
    }

    if (text.startsWith('/progress')) {
      await this.studentService.handleProgress(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/payments')) {
      await this.studentService.handlePayments(chatId, fromUser.id, 1);
      return;
    }

    if (text.startsWith('/certificates')) {
      await this.studentService.handleCertificates(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/notifications')) {
      await this.studentService.handleNotifications(chatId, fromUser.id, 1);
      return;
    }

    if (text.startsWith('/settings')) {
      await this.studentService.handleSettings(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/cancel')) {
      await this.registrationService.cancelRegistration(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/unlink') || text.startsWith('/disconnect')) {
      await this.studentService.handleUnlink(chatId, fromUser.id);
      return;
    }

    if (text.startsWith('/')) {
      // Ignore unknown slash commands
      return;
    }

    // Check active checkout session state
    const checkoutSession = await getTelegramCheckoutSession(
      this.database.client,
      String(fromUser.id),
    );

    if (checkoutSession) {
      if (checkoutSession.step === 'AWAITING_PROMO_CODE' && text) {
        await this.checkoutService.handlePromoInput(chatId, fromUser.id, text);
        return;
      }
      if (checkoutSession.step === 'AWAITING_PAYMENT_REFERENCE' && text) {
        await this.checkoutService.handleReferenceInput(
          chatId,
          fromUser.id,
          text,
        );
        return;
      }
      if (checkoutSession.step === 'AWAITING_SEARCH_QUERY' && text) {
        await this.studentService.handleCourses(chatId, 1, text);
        return;
      }
      if (checkoutSession.step === 'AWAITING_PAYMENT_RECEIPT') {
        const photo = message.photo;
        const document = message.document;

        if (photo && photo.length > 0) {
          const largestPhoto = photo[photo.length - 1];
          if (largestPhoto?.file_id) {
            await this.checkoutService.handleReceiptUpload(
              chatId,
              fromUser.id,
              largestPhoto.file_id,
              'image/jpeg',
              'telegram-receipt.jpg',
            );
            return;
          }
        } else if (document && document.file_id) {
          await this.checkoutService.handleReceiptUpload(
            chatId,
            fromUser.id,
            document.file_id,
            document.mime_type || 'application/pdf',
            document.file_name || 'telegram-receipt.pdf',
          );
          return;
        }
      }
    }

    // Check active registration state (TG5.35 & TG6)
    const onboardingState = await getTelegramOnboardingState(
      this.database.client,
      String(fromUser.id),
    );

    if (onboardingState) {
      if (onboardingState.step === 'AWAITING_EMAIL') {
        const existing = await findAuthUserByEmail(
          this.database.client,
          text.trim().toLowerCase(),
        );
        if (existing) {
          await this.registrationService.submitExistingAccountEmail(
            chatId,
            fromUser.id,
            text,
          );
        } else {
          await this.registrationService.submitEmail(
            chatId,
            fromUser.id,
            text,
            fromUser.username,
          );
        }
        return;
      }
      if (onboardingState.step === 'AWAITING_OTP') {
        if (onboardingState.email) {
          const existing = await findAuthUserByEmail(
            this.database.client,
            onboardingState.email,
          );
          if (existing) {
            await this.registrationService.submitExistingAccountOtp(
              chatId,
              fromUser.id,
              text,
              fromUser.username,
            );
            return;
          }
        }
        await this.registrationService.submitOtp(chatId, fromUser.id, text);
        return;
      }
      if (
        onboardingState.step === 'EMAIL_VERIFIED' ||
        onboardingState.step === 'AWAITING_PASSWORD'
      ) {
        await this.registrationService.submitPassword(
          chatId,
          fromUser.id,
          text,
          message.message_id,
        );
        return;
      }
      if (onboardingState.step === 'AWAITING_PASSWORD_CONFIRMATION') {
        await this.registrationService.submitPasswordConfirmation(
          chatId,
          fromUser.id,
          text,
          message.message_id,
          fromUser.first_name,
          fromUser.last_name,
          fromUser.username,
        );
        return;
      }
    }

    this.logger.log(
      `Message from Telegram user ${fromUser.id}: ${text.slice(0, 30)}`,
    );
  }

  private async handleStartCommand(params: {
    chatId: number;
    telegramUserId: number;
    telegramUsername?: string;
    firstName: string;
    fullText: string;
  }): Promise<void> {
    const parts = params.fullText.split(/\s+/);
    const payload = parts.slice(1).join(' ').trim() || undefined;

    if (payload) {
      this.logger.log(
        `Received /start linking payload attempt from Telegram ID ${params.telegramUserId}`,
      );

      await this.processLinkPayload({
        chatId: params.chatId,
        telegramUserId: params.telegramUserId,
        telegramUsername: params.telegramUsername,
        payload,
      });
      return;
    }

    const resolution = await this.identityResolver.resolveIdentity(
      params.telegramUserId,
    );

    if (resolution.status === 'LINKED' && resolution.user) {
      const welcomeText =
        `Welcome back to Joel Talargie Academy, ${resolution.user.firstName || params.firstName}!\n\n` +
        `✅ Your Telegram account is linked to your LMS account (${resolution.user.email}).\n` +
        `Academy learning services will be accessible here in upcoming features.`;

      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: welcomeText,
      });
      return;
    }

    if (resolution.status === 'SUSPENDED') {
      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: 'Your Joel Academy account is currently suspended. Please contact platform support.',
      });
      return;
    }

    // UNLINKED status without payload (TG5.2)
    await this.telegramClient.sendMessage({
      chat_id: params.chatId,
      text:
        `Welcome to Joel Talargie Academy 👋\n\n` +
        `Your Telegram account is not connected yet.\n\n` +
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

  private async processLinkPayload(params: {
    chatId: number;
    telegramUserId: number;
    telegramUsername?: string;
    payload: string;
  }): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(params.payload)
      .digest('hex');

    const result = await consumeAccountLinkToken(this.database.client, {
      tokenHash,
      purpose: TELEGRAM_LINK_PURPOSE,
    });

    if (!result.valid) {
      if (result.reason === 'TOKEN_EXPIRED') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'This connection link has expired.\nPlease create a new Telegram connection link from your academy account.',
        });
        return;
      }

      if (result.reason === 'TOKEN_ALREADY_USED') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'This connection link has already been used.\nPlease return to your academy account.',
        });
        return;
      }

      // Invalid token
      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: 'This connection link is invalid.',
      });
      return;
    }

    const userId = result.userId!;

    try {
      await linkTelegramAccount(this.database.client, {
        userId,
        telegramId: String(params.telegramUserId),
        telegramUsername: params.telegramUsername,
      });

      this.logger.log(
        `Successfully linked Telegram ID ${params.telegramUserId} to LMS user ID ${userId}`,
      );

      // Create in-app notification for the web application
      try {
        const usernameDisplay = params.telegramUsername
          ? `@${params.telegramUsername.replace(/^@/, '')}`
          : 'account';
        await this.database.client.insert(schema.notifications).values({
          userId,
          channel: 'IN_APP',
          status: 'SENT',
          type: 'TELEGRAM_ACCOUNT_LINKED',
          title: 'Telegram Account Connected',
          body: `Your Telegram account (${usernameDisplay}) was successfully connected to your academy profile.`,
          actionUrl: '/dashboard/profile',
          priority: 'NORMAL',
          deduplicationKey: `in-app:telegram-link:${params.telegramUserId}:${Date.now()}`,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        this.logger.warn(
          'Failed to insert in-app notification for Telegram link:',
          notifErr,
        );
      }

      const dashboardReturnUrl = `${this.telegramConfig.webAppUrl}/dashboard/profile`;
      const hasValidHttpsUrl = dashboardReturnUrl.startsWith('https://');

      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text:
          `✅ Telegram Connected\n\n` +
          `Your Telegram account is now connected to your Joel Talargie Academy account.\n\n` +
          `You can return to the academy website.`,
        ...(hasValidHttpsUrl
          ? {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Open Academy',
                      url: dashboardReturnUrl,
                    },
                  ],
                ],
              },
            }
          : {}),
      });
    } catch (error: any) {
      const msg = error?.message || String(error);

      if (msg === 'TELEGRAM_ID_ALREADY_LINKED_TO_OTHER_USER') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'This Telegram account is already connected to another academy account.',
        });
        return;
      }

      if (msg === 'USER_ALREADY_HAS_LINKED_TELEGRAM_ACCOUNT') {
        await this.telegramClient.sendMessage({
          chat_id: params.chatId,
          text: 'Your academy account already has a Telegram account connected.',
        });
        return;
      }

      this.logger.error(
        `Failed to link Telegram account for user ${userId}:`,
        error,
      );

      await this.telegramClient.sendMessage({
        chat_id: params.chatId,
        text: 'An error occurred while linking your Telegram account. Please try again from the website.',
      });
    }
  }
}
