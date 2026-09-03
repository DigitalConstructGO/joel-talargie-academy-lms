import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  clearTelegramCheckoutSession,
  getTelegramCheckoutSession,
  upsertTelegramCheckoutSession,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { CatalogService } from '../../catalog/services/catalog.service';
import { EnrollmentsService } from '../../enrollments/services/enrollments.service';
import { PaymentsService } from '../../payments/services/payments.service';
import { PaymentMethodsService } from '../../payment-methods/services/payment-methods.service';
import { RedemptionService } from '../../promotions/services/redemption.service';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../../storage/storage.interface';
import { TelegramClientService } from './telegram-client.service';
import { TelegramConfigService } from './telegram-config.service';
import { TelegramFormattingService } from './telegram-formatting.service';
import { TelegramIdentityResolverService } from './telegram-identity-resolver.service';
import { TelegramKeyboardService } from './telegram-keyboard.service';

const ALLOWED_RECEIPT_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export class TelegramCheckoutService {
  private readonly logger = new Logger(TelegramCheckoutService.name);

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(CatalogService) private readonly catalogService: CatalogService,
    @Inject(EnrollmentsService)
    private readonly enrollmentsService: EnrollmentsService,
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
    @Inject(PaymentMethodsService)
    private readonly paymentMethodsService: PaymentMethodsService,
    @Inject(RedemptionService)
    private readonly redemptionService: RedemptionService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(TelegramClientService)
    private readonly telegramClient: TelegramClientService,
    @Inject(TelegramConfigService)
    private readonly telegramConfig: TelegramConfigService,
    @Inject(TelegramFormattingService)
    private readonly formatting: TelegramFormattingService,
    @Inject(TelegramIdentityResolverService)
    private readonly identityResolver: TelegramIdentityResolverService,
    @Inject(TelegramKeyboardService)
    private readonly keyboard: TelegramKeyboardService,
  ) {}

  private isNotFound(error: any): boolean {
    return (
      error instanceof NotFoundException ||
      error?.name === 'NotFoundException' ||
      error?.status === 404 ||
      error?.response?.code === 'COURSE_NOT_FOUND'
    );
  }

  /**
   * Check for an active session for /start resume detection.
   */
  async checkActiveSession(
    chatId: number,
    telegramUserId: number,
  ): Promise<boolean> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) return false;

    try {
      const course = await this.catalogService.publicCourse(session.courseId);
      if (!course) {
        await clearTelegramCheckoutSession(
          this.database.client,
          String(telegramUserId),
        );
        return false;
      }

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `🛒 <b>Unfinished Enrollment</b>\n\n` +
          `You have an unfinished enrollment for <b>${this.formatting.escapeHtml(course.title)}</b>.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '▶️ Resume Enrollment',
                callback_data: `resume_checkout:${course.id}`,
              },
            ],
            [
              {
                text: '❌ Cancel Enrollment',
                callback_data: 'cancel_checkout',
              },
            ],
            [{ text: '🏠 Main Menu', callback_data: 'student_menu' }],
          ],
        },
      });
      return true;
    } catch {
      await clearTelegramCheckoutSession(
        this.database.client,
        String(telegramUserId),
      );
      return false;
    }
  }

  /**
   * Start enrollment flow for a selected course.
   */
  async handleStartEnrollment(
    chatId: number,
    telegramUserId: number,
    courseId: string,
  ): Promise<void> {
    const resolution =
      await this.identityResolver.resolveIdentity(telegramUserId);

    if (resolution.status === 'UNLINKED' || !resolution.user) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `Your Telegram account is not connected to an academy account yet.\n\n` +
          `Please create an account or connect your existing account to enroll:`,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildUnlinkedKeyboard(),
      });
      return;
    }

    if (
      resolution.status === 'SUSPENDED' ||
      resolution.user.status !== 'ACTIVE'
    ) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Your Joel Academy account is currently restricted or suspended. Please contact platform support.`,
      });
      return;
    }

    try {
      const course = await this.catalogService.publicCourse(courseId);
      if (!course) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `This course is no longer available for enrollment.`,
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      // Check if student is already enrolled
      const existing = await this.enrollmentsService.mine(resolution.user.id, {
        page: 1,
        pageSize: 50,
      });
      const currentEnrollment = (existing.items || []).find(
        (e: any) => e.courseId === course.id,
      );

      if (currentEnrollment) {
        if (
          ['ENROLLED', 'IN_PROGRESS', 'COMPLETED'].includes(
            currentEnrollment.status,
          )
        ) {
          const inline_keyboard: Array<
            Array<{ text: string; url?: string; callback_data?: string }>
          > = [];
          if (
            this.telegramConfig.webAppUrl &&
            this.telegramConfig.webAppUrl.startsWith('https://')
          ) {
            inline_keyboard.push([
              {
                text: '▶️ Continue Learning',
                url: `${this.telegramConfig.webAppUrl}/dashboard/my-courses`,
              },
            ]);
          }
          inline_keyboard.push([
            { text: '📚 My Courses', callback_data: 'student_my_courses' },
          ]);

          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text: `You are already enrolled in <b>${this.formatting.escapeHtml(course.title)}</b>!`,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard },
          });
          return;
        }

        if (
          currentEnrollment.status === 'PENDING_PAYMENT' ||
          currentEnrollment.status === 'WAITING_APPROVAL'
        ) {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text:
              `⏳ <b>Payment Under Review</b>\n\n` +
              `You already have an active payment submission for <b>${this.formatting.escapeHtml(course.title)}</b>.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '💳 View Payments',
                    callback_data: 'student_payments',
                  },
                ],
                [{ text: '🏠 Main Menu', callback_data: 'student_menu' }],
              ],
            },
          });
          return;
        }
      }

      const isFree =
        course.accessType === 'FREE' || Number(course.price || 0) === 0;

      await upsertTelegramCheckoutSession(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: isFree ? 'CONFIRM_FREE' : 'PROMO_OPTION',
        courseId: course.id,
        promoCode: null,
        paymentMethodId: null,
        transactionId: null,
        receiptStorageKey: null,
      });

      if (isFree) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `🎓 <b>Confirm Free Enrollment</b>\n\n` +
            `Course: <b>${this.formatting.escapeHtml(course.title)}</b>\n` +
            `Price: <b>FREE</b>\n` +
            `Payment: Not Required\n\n` +
            `Would you like to confirm your enrollment?`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Confirm Enrollment',
                  callback_data: `confirm_free_enrollment:${course.id}`,
                },
              ],
              [{ text: '❌ Cancel', callback_data: 'cancel_checkout' }],
            ],
          },
        });
        return;
      }

      // Paid Course Initial Review
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `🛒 <b>Course Enrollment</b>\n\n` +
          `Course: <b>${this.formatting.escapeHtml(course.title)}</b>\n` +
          `Original Price: <b>${course.currency || 'ETB'} ${Number(course.price).toLocaleString()}</b>\n\n` +
          `Do you have a promo code?`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🏷️ Apply Promo Code',
                callback_data: 'prompt_promo_code',
              },
            ],
            [
              {
                text: '➡️ Continue Without Promo',
                callback_data: 'skip_promo_code',
              },
            ],
            [{ text: '❌ Cancel', callback_data: 'cancel_checkout' }],
          ],
        },
      });
    } catch (error) {
      if (this.isNotFound(error)) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `This course is no longer available for enrollment.`,
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }
      this.logger.error(`Error in handleStartEnrollment:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't start checkout right now. Please try again later.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * Prompt student to type a promo code.
   */
  async handlePromptPromo(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    await upsertTelegramCheckoutSession(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_PROMO_CODE',
    });

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `🏷️ <b>Apply Promo Code</b>\n\n` +
        `Please type and send your promo code in chat (e.g. <code>WEB30</code>):`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ Skip Promo', callback_data: 'skip_promo_code' }],
          [{ text: '❌ Cancel Checkout', callback_data: 'cancel_checkout' }],
        ],
      },
    });
  }

  /**
   * Process promo code input string typed by student.
   */
  async handlePromoInput(
    chatId: number,
    telegramUserId: number,
    promoCode: string,
  ): Promise<void> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Your checkout session has expired. Please select a course to start again.`,
        reply_markup: this.keyboard.buildCoursesKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
      return;
    }

    const resolution =
      await this.identityResolver.resolveIdentity(telegramUserId);
    if (!resolution.user) return;

    try {
      const course = await this.catalogService.publicCourse(session.courseId);
      if (!course) return;

      const authUser = {
        id: resolution.user.id,
        email: resolution.user.email,
        roles: resolution.user.roles || ['STUDENT'],
        emailVerified: true,
      };

      const result = await this.redemptionService.validate(
        authUser as any,
        { courseId: course.id, code: promoCode },
        { userAgent: 'TelegramBot' },
      );

      if (!result.valid) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `❌ <b>Invalid Promo Code</b>\n\n` +
            `${this.formatting.escapeHtml(result.message || 'Promo code is not applicable.')}\n\n` +
            `Would you like to try another code or continue?`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🏷️ Try Another Code',
                  callback_data: 'prompt_promo_code',
                },
              ],
              [
                {
                  text: '➡️ Continue Without Promo',
                  callback_data: 'skip_promo_code',
                },
              ],
              [{ text: '❌ Cancel', callback_data: 'cancel_checkout' }],
            ],
          },
        });
        return;
      }

      await upsertTelegramCheckoutSession(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'PROMO_APPLIED',
        promoCode: result.code || promoCode,
      });

      const original = result.pricing.originalPrice;
      const discount = result.pricing.discountAmount;
      const finalPrice = result.pricing.finalPrice;
      const currency = result.pricing.currency || 'ETB';

      let text =
        `✅ <b>Promo Applied!</b>\n\n` +
        `Course: <b>${this.formatting.escapeHtml(course.title)}</b>\n` +
        `Original Price: ${currency} ${original.toLocaleString()}\n` +
        `Promo Code: <code>${result.code}</code>\n` +
        `Discount: - ${currency} ${discount.toLocaleString()}\n` +
        `<b>Amount to Pay: ${currency} ${finalPrice.toLocaleString()}</b>\n\n`;

      if (finalPrice === 0) {
        text += `🎉 With this promotion, your course is 100% FREE!`;
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Confirm Free Enrollment',
                  callback_data: `confirm_free_enrollment:${course.id}`,
                },
              ],
              [{ text: '❌ Cancel', callback_data: 'cancel_checkout' }],
            ],
          },
        });
        return;
      }

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💳 Continue to Payment',
                callback_data: 'continue_to_payment_methods',
              },
            ],
            [{ text: '🏷️ Change Promo', callback_data: 'prompt_promo_code' }],
            [{ text: '🗑️ Remove Promo', callback_data: 'skip_promo_code' }],
            [{ text: '❌ Cancel', callback_data: 'cancel_checkout' }],
          ],
        },
      });
    } catch (error) {
      if (this.isNotFound(error)) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `This course is no longer available for enrollment.`,
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }
      this.logger.error(`Error validating promo code:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't validate that promo code right now. Please try again.`,
      });
    }
  }

  /**
   * Display payment method selection.
   */
  async handleSelectPaymentMethod(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Your checkout session has expired. Please select a course to start again.`,
        reply_markup: this.keyboard.buildCoursesKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
      return;
    }

    try {
      const activeMethods = await this.paymentMethodsService.listActive();
      await upsertTelegramCheckoutSession(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'PAYMENT_METHOD_SELECTION',
      });

      if (activeMethods.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `💳 <b>Payment Methods</b>\n\n` +
            `No payment methods are currently active. Please contact support or complete payment on the website.`,
          reply_markup: this.keyboard.buildHelpKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      const keyboardRows: any[] = activeMethods.map((m: any) => [
        {
          text: `💳 ${m.name}`,
          callback_data: `choose_payment_method:${m.id}`,
        },
      ]);
      keyboardRows.push([
        { text: '❌ Cancel Checkout', callback_data: 'cancel_checkout' },
      ]);

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `💳 <b>Select Payment Method</b>\n\nPlease select your preferred payment method below:`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboardRows },
      });
    } catch (error) {
      this.logger.error(`Error in handleSelectPaymentMethod:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load available payment methods right now.`,
      });
    }
  }

  /**
   * Handle payment method selection.
   */
  async handleChoosePaymentMethod(
    chatId: number,
    telegramUserId: number,
    methodId: string,
  ): Promise<void> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) return;

    try {
      const method =
        await this.paymentMethodsService.requireActiveById(methodId);
      const course = await this.catalogService.publicCourse(session.courseId);

      await upsertTelegramCheckoutSession(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'AWAITING_PAYMENT_REFERENCE',
        paymentMethodId: method.id,
      });

      let text =
        `💳 <b>${this.formatting.escapeHtml(method.name)} Payment Instructions</b>\n\n` +
        `Course: <b>${this.formatting.escapeHtml(course?.title || 'Course')}</b>\n`;

      const formattedInstructions = this.formatInstructionText(
        method.instructions,
      );
      if (formattedInstructions) {
        text += `\n${this.formatting.escapeHtml(formattedInstructions)}\n`;
      }
      if (method.accountNumber) {
        text += `\nAccount Number: <code>${this.formatting.escapeHtml(method.accountNumber)}</code>`;
      }
      if (method.accountName) {
        text += `\nAccount Name: <b>${this.formatting.escapeHtml(method.accountName)}</b>`;
      }

      text += `\n\nPlease type and send your <b>Transaction / Reference Number</b> in chat:`;

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⬅️ Back to Payment Methods',
                callback_data: 'continue_to_payment_methods',
              },
            ],
            [{ text: '❌ Cancel', callback_data: 'cancel_checkout' }],
          ],
        },
      });
    } catch (error) {
      if (this.isNotFound(error)) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `This course is no longer available for enrollment.`,
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }
      this.logger.error(`Error choosing payment method:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Invalid payment method selected. Please select from available options.`,
      });
    }
  }

  /**
   * Handle reference string input typed by student.
   */
  async handleReferenceInput(
    chatId: number,
    telegramUserId: number,
    reference: string,
  ): Promise<void> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) return;

    const trimmed = reference.trim();
    if (trimmed.length < 3) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Please enter a valid payment transaction / reference number (at least 3 characters).`,
      });
      return;
    }

    await upsertTelegramCheckoutSession(this.database.client, {
      telegramUserId: String(telegramUserId),
      step: 'AWAITING_PAYMENT_RECEIPT',
      transactionId: trimmed,
    });

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `✅ Reference Saved: <code>${this.formatting.escapeHtml(trimmed)}</code>\n\n` +
        `Now, please send your <b>Payment Receipt</b> (Photo or PDF document) in chat:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel Checkout', callback_data: 'cancel_checkout' }],
        ],
      },
    });
  }

  /**
   * Process photo or document receipt uploaded by student.
   */
  async handleReceiptUpload(
    chatId: number,
    telegramUserId: number,
    fileId: string,
    mimeType = 'image/jpeg',
    originalName = 'telegram-receipt.jpg',
  ): Promise<void> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Your checkout session has expired. Please start again.`,
      });
      return;
    }

    if (!ALLOWED_RECEIPT_MIMES.has(mimeType)) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Disallowed file type (${mimeType}). Please upload a JPEG, PNG, WEBP image or PDF receipt.`,
      });
      return;
    }

    try {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `⏳ Processing receipt upload...`,
      });

      const fileInfo = await this.telegramClient.getFile(fileId);
      if (!fileInfo || !fileInfo.file_path) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `We couldn't download the receipt file from Telegram. Please try uploading again.`,
        });
        return;
      }

      const fileBuffer = await this.telegramClient.downloadFile(
        fileInfo.file_path,
      );
      if (!fileBuffer || fileBuffer.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `Downloaded receipt file was empty. Please try uploading again.`,
        });
        return;
      }

      const ext = originalName.includes('.')
        ? originalName.split('.').pop()
        : 'jpg';
      const key = `payment-receipts/tg_${telegramUserId}_${Date.now()}.${ext}`;

      await this.storage.upload({
        key,
        body: fileBuffer,
        contentType: mimeType,
      });

      await upsertTelegramCheckoutSession(this.database.client, {
        telegramUserId: String(telegramUserId),
        step: 'REVIEW',
        receiptStorageKey: key,
      });

      await this.handleReviewPayment(chatId, telegramUserId);
    } catch (error) {
      this.logger.error(`Error processing receipt upload:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Failed to store receipt. Please try uploading again.`,
      });
    }
  }

  /**
   * Display final payment review card.
   */
  async handleReviewPayment(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) return;

    try {
      const course = await this.catalogService.publicCourse(session.courseId);
      if (!course) return;

      const resolution =
        await this.identityResolver.resolveIdentity(telegramUserId);
      if (!resolution.user) return;

      let method: any = null;
      if (session.paymentMethodId) {
        try {
          method = await this.paymentMethodsService.requireActiveById(
            session.paymentMethodId,
          );
        } catch {
          // ignore
        }
      }

      let priceText = `${course.currency || 'ETB'} ${Number(course.price).toLocaleString()}`;
      let discountText = 'None';
      let finalPrice = Number(course.price);

      if (session.promoCode) {
        const authUser = {
          id: resolution.user.id,
          email: resolution.user.email,
          roles: resolution.user.roles || ['STUDENT'],
          emailVerified: true,
        };
        const validation = await this.redemptionService.validate(
          authUser as any,
          { courseId: course.id, code: session.promoCode },
          { userAgent: 'TelegramBot' },
        );
        if (validation.valid) {
          discountText = `- ${validation.pricing.currency} ${validation.pricing.discountAmount.toLocaleString()}`;
          finalPrice = validation.pricing.finalPrice;
        }
      }

      const text =
        `💳 <b>Review Payment</b>\n\n` +
        `Course: <b>${this.formatting.escapeHtml(course.title)}</b>\n` +
        `Original Price: ${priceText}\n` +
        `Promo Code: ${session.promoCode ? `<code>${session.promoCode}</code>` : 'None'}\n` +
        `Discount: ${discountText}\n` +
        `<b>Final Amount: ${course.currency || 'ETB'} ${finalPrice.toLocaleString()}</b>\n\n` +
        `Payment Method: <b>${this.formatting.escapeHtml(method?.name || 'Manual Transfer')}</b>\n` +
        `Reference: <code>${this.formatting.escapeHtml(session.transactionId || 'None')}</code>\n` +
        `Receipt: ${session.receiptStorageKey ? 'Uploaded ✅' : 'Not Uploaded ❌'}\n\n` +
        `After submission your payment will be reviewed by an administrator.`;

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Submit Payment',
                callback_data: 'submit_final_payment',
              },
            ],
            [{ text: '❌ Cancel', callback_data: 'cancel_checkout' }],
          ],
        },
      });
    } catch (error) {
      this.logger.error(`Error in handleReviewPayment:`, error);
    }
  }

  /**
   * Submit free enrollment or paid payment transaction.
   */
  async handleSubmitPayment(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    const session = await getTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    if (!session || !session.courseId) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Your checkout session has expired. Please select a course to start again.`,
      });
      return;
    }

    const resolution =
      await this.identityResolver.resolveIdentity(telegramUserId);
    if (!resolution.user) return;

    try {
      const course = await this.catalogService.publicCourse(session.courseId);
      if (!course) return;

      const authUser = {
        id: resolution.user.id,
        email: resolution.user.email,
        roles: resolution.user.roles || ['STUDENT'],
        emailVerified: true,
        firstName: resolution.user.email.split('@')[0],
      };

      let redemptionId: string | undefined = undefined;

      // Handle promo code redemption if code present
      if (session.promoCode) {
        try {
          const redemptionResult = await this.redemptionService.redeem(
            authUser as any,
            { courseId: course.id, code: session.promoCode },
            { userAgent: 'TelegramBot' },
          );
          redemptionId = redemptionResult.redemptionId;
        } catch (err) {
          this.logger.warn(`Promo redemption failed during submit:`, err);
        }
      }

      // Create enrollment record
      const enrollmentResult = await this.enrollmentsService.create(
        authUser as any,
        course.id,
        redemptionId,
      );

      const enrollment = enrollmentResult.enrollment;

      // If FREE course or 100% discount promo result
      if (
        enrollment.status === 'ENROLLED' ||
        course.accessType === 'FREE' ||
        Number(course.price) === 0
      ) {
        const successKeyboard: Array<
          Array<{ text: string; url?: string; callback_data?: string }>
        > = [];
        if (
          this.telegramConfig.webAppUrl &&
          this.telegramConfig.webAppUrl.startsWith('https://')
        ) {
          successKeyboard.push([
            {
              text: '▶️ Start Learning',
              url: `${this.telegramConfig.webAppUrl}/dashboard/my-courses`,
            },
          ]);
        }
        successKeyboard.push([
          { text: '📚 My Courses', callback_data: 'student_my_courses' },
        ]);
        successKeyboard.push([
          { text: '🏠 Main Menu', callback_data: 'student_menu' },
        ]);

        await clearTelegramCheckoutSession(
          this.database.client,
          String(telegramUserId),
        );
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `🎉 <b>Enrollment Successful!</b>\n\n` +
            `You are now enrolled in <b>${this.formatting.escapeHtml(course.title)}</b>.\n` +
            `Your course is ready to start.`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: successKeyboard,
          },
        });
        return;
      }

      // Check if already submitted or enrolled
      if (enrollment.status === 'WAITING_APPROVAL') {
        await clearTelegramCheckoutSession(
          this.database.client,
          String(telegramUserId),
        );
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `⏳ <b>Payment Already Submitted</b>\n\n` +
            `Your payment proof for <b>${this.formatting.escapeHtml(course.title)}</b> is already submitted and awaiting administrator approval.`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💳 View Payments', callback_data: 'student_payments' }],
              [{ text: '🏠 Main Menu', callback_data: 'student_menu' }],
            ],
          },
        });
        return;
      }

      // Submit manual payment proof
      if (!session.receiptStorageKey || !session.transactionId) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `Payment reference or receipt upload is missing. Please complete all fields.`,
        });
        return;
      }

      // Prepare fake Multer file object for PaymentsService
      const fakeMulterFile: Express.Multer.File = {
        fieldname: 'receipt',
        originalname: 'telegram-receipt.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 4,
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await this.paymentsService.submit(
        authUser as any,
        enrollment.id,
        {
          transactionId: session.transactionId,
          submittedAmount: String(course.price),
          currency: course.currency || 'ETB',
          paymentMethodId: session.paymentMethodId || undefined,
        },
        fakeMulterFile,
      );

      await clearTelegramCheckoutSession(
        this.database.client,
        String(telegramUserId),
      );

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `⏳ <b>Payment Submitted</b>\n\n` +
          `Your payment for <b>${this.formatting.escapeHtml(course.title)}</b> has been submitted successfully.\n\n` +
          `Status: <b>Pending Admin Approval</b>\n` +
          `Course Access: 🔒 <b>Locked</b>\n\n` +
          `You will receive a notification when an administrator reviews your payment.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 View Payments', callback_data: 'student_payments' }],
            [{ text: '🏠 Main Menu', callback_data: 'student_menu' }],
          ],
        },
      });
    } catch (error) {
      if (this.isNotFound(error)) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `This course is no longer available for enrollment.`,
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      const errCode = (error as any)?.response?.code || (error as any)?.code;
      if (
        errCode === 'PAYMENT_REVIEW_ALREADY_PENDING' ||
        errCode === 'PAYMENT_NOT_REQUIRED'
      ) {
        await clearTelegramCheckoutSession(
          this.database.client,
          String(telegramUserId),
        );
        const isEnrolled = errCode === 'PAYMENT_NOT_REQUIRED';
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: isEnrolled
            ? `🎉 You are already enrolled in this course!`
            : `⏳ Your payment proof for this course is already submitted and pending administrator approval.`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              isEnrolled
                ? [
                    {
                      text: '📚 My Courses',
                      callback_data: 'student_my_courses',
                    },
                  ]
                : [
                    {
                      text: '💳 View Payments',
                      callback_data: 'student_payments',
                    },
                  ],
              [{ text: '🏠 Main Menu', callback_data: 'student_menu' }],
            ],
          },
        });
        return;
      }

      this.logger.error(`Error submitting payment:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Failed to submit payment. Please try again or complete checkout on the website.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * Cancel active checkout session.
   */
  async handleCancelCheckout(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    await clearTelegramCheckoutSession(
      this.database.client,
      String(telegramUserId),
    );
    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: `Checkout cancelled.`,
      reply_markup: this.keyboard.buildStudentMainMenuKeyboard(
        this.telegramConfig.webAppUrl,
      ),
    });
  }

  private formatInstructionText(instructions: unknown): string {
    if (!instructions) return '';
    if (typeof instructions === 'string') return instructions;
    if (typeof instructions === 'object' && instructions !== null) {
      const obj = instructions as Record<string, any>;
      if (typeof obj.en === 'string' && obj.en) return obj.en;
      if (typeof obj.text === 'string' && obj.text) return obj.text;
      if (typeof obj.am === 'string' && obj.am) return obj.am;
      if (typeof obj.details === 'string' && obj.details) return obj.details;
      if (Array.isArray(obj.steps)) return obj.steps.join('\n');

      const textValues = Object.values(obj).filter(
        (val): val is string => typeof val === 'string' && Boolean(val.trim()),
      );
      if (textValues.length > 0) {
        return textValues.join('\n');
      }
    }
    return '';
  }
}
