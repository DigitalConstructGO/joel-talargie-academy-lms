import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { CatalogService } from '../../catalog/services/catalog.service';
import { EnrollmentsService } from '../../enrollments/services/enrollments.service';
import { EnrollmentStatus } from '../../enrollments/dto/enrollment.dto';
import { LearningService } from '../../learning/services/learning.service';
import { PaymentsService } from '../../payments/services/payments.service';
import { CertificatesService } from '../../certificates/services/certificates.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { TelegramClientService } from './telegram-client.service';
import { TelegramConfigService } from './telegram-config.service';
import { TelegramFormattingService } from './telegram-formatting.service';
import { TelegramIdentityResolverService } from './telegram-identity-resolver.service';
import { TelegramKeyboardService } from './telegram-keyboard.service';

import { TelegramLinkService } from './telegram-link.service';

@Injectable()
export class TelegramStudentService {
  private readonly logger = new Logger(TelegramStudentService.name);

  constructor(
    @Inject(CatalogService) private readonly catalogService: CatalogService,
    @Inject(EnrollmentsService)
    private readonly enrollmentsService: EnrollmentsService,
    @Inject(LearningService) private readonly learningService: LearningService,
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
    @Inject(CertificatesService)
    private readonly certificatesService: CertificatesService,
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
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
    @Inject(TelegramLinkService)
    private readonly linkService: TelegramLinkService,
  ) {}

  /**
   * Safe identity resolution wrapper for student commands.
   */
  private async resolveStudentUser(chatId: number, telegramUserId: number) {
    const resolution =
      await this.identityResolver.resolveIdentity(telegramUserId);

    if (
      resolution.status === 'SUSPENDED' ||
      (resolution.user && resolution.user.status !== 'ACTIVE')
    ) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Your Joel Academy account is currently restricted or suspended. Please contact platform support.`,
      });
      return null;
    }

    if (resolution.status === 'UNLINKED' || !resolution.user) {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `Your Telegram account is not connected to an academy account yet.\n\n` +
          `Please create an account or connect your existing account below:`,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildUnlinkedKeyboard(),
      });
      return null;
    }

    const authUser: AuthUser = {
      id: resolution.user.id,
      email: resolution.user.email,
      firstName: resolution.user.firstName || 'Student',
      lastName: resolution.user.lastName || '',
      roles: resolution.user.roles || ['STUDENT'],
      avatarUrl: resolution.user.avatarUrl || null,
      provider: 'TELEGRAM',
      emailVerified: resolution.user.emailVerified ?? true,
    };

    return authUser;
  }

  /**
   * `/start` — Student Home
   */
  async handleStart(
    chatId: number,
    telegramUserId: number,
    firstName?: string,
  ): Promise<void> {
    const resolution =
      await this.identityResolver.resolveIdentity(telegramUserId);

    if (resolution.status === 'LINKED' && resolution.user) {
      const name = resolution.user.firstName || firstName || 'Student';
      const welcomeText =
        `Welcome back to Joel Talargie Academy 👋\n\n` +
        `Hello <b>${this.formatting.escapeHtml(name)}</b>! What would you like to do?`;

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildStudentMainMenuKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
      return;
    }

    if (resolution.status === 'SUSPENDED') {
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: 'Your Joel Academy account is currently suspended. Please contact platform support.',
      });
      return;
    }

    // Unlinked onboarding
    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text:
        `Welcome to Joel Talargie Academy 👋\n\n` +
        `Your Telegram account is not connected yet.\n\n` +
        `Choose an option:`,
      reply_markup: this.keyboard.buildUnlinkedKeyboard(),
    });
  }

  /**
   * `/help`
   */
  async handleHelp(chatId: number): Promise<void> {
    const helpText =
      `<b>Joel Talargie Academy Bot</b>\n\n` +
      `Available student services:\n\n` +
      `📚 <b>My Courses</b>\nView your enrolled courses.\n\n` +
      `📈 <b>Progress</b>\nCheck your current learning progress.\n\n` +
      `💳 <b>Payments</b>\nView your payment status.\n\n` +
      `🏆 <b>Certificates</b>\nView available certificates.\n\n` +
      `🔔 <b>Notifications</b>\nView recent academy notifications.\n\n` +
      `👤 <b>Account</b>\nView your academy account summary.`;

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: helpText,
      parse_mode: 'HTML',
      reply_markup: this.keyboard.buildHelpKeyboard(
        this.telegramConfig.webAppUrl,
      ),
    });
  }

  /**
   * `/account`
   */
  async handleAccount(chatId: number, telegramUserId: number): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    const text = this.formatting.formatAccount({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: 'ACTIVE',
      roles: user.roles,
    });

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: this.keyboard.buildAccountKeyboard(
        this.telegramConfig.webAppUrl,
      ),
    });
  }

  /**
   * `/courses` — Public course catalog browse (5 per page with thumbnails)
   */
  async handleCourses(
    chatId: number,
    page = 1,
    searchQuery?: string | null,
    filterType?: string | null,
  ): Promise<void> {
    try {
      const query: any = { page, pageSize: 5, sort: 'newest' };
      if (searchQuery) query.search = searchQuery;

      const result = await this.catalogService.publicCourses(query);
      let courses = result.items || [];

      if (filterType === 'FREE') {
        courses = courses.filter(
          (c: any) => c.accessType === 'FREE' || Number(c.price || 0) === 0,
        );
      } else if (filterType === 'PAID') {
        courses = courses.filter(
          (c: any) => c.accessType === 'PAID' && Number(c.price || 0) > 0,
        );
      }

      const total = result.total || 0;
      const totalPages = Math.ceil(total / 5) || 1;

      if (courses.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `📚 <b>Browse Courses</b>\n\nNo courses found matching your criteria.`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildCoursesPaginatedKeyboard(
            page,
            totalPages,
            filterType,
            searchQuery,
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      // Send course cards
      for (const course of courses) {
        const cardText = this.formatting.formatCourseCard(course);
        const cardButtons = {
          inline_keyboard: [
            [
              {
                text: '📖 View Details',
                callback_data: `course_detail:${course.id}`,
              },
              {
                text: '🚀 Enroll',
                callback_data: `start_enrollment:${course.id}`,
              },
            ],
          ],
        };

        const thumbnailUrl =
          course.thumbnailUrl ||
          (course.thumbnailKey
            ? `${this.telegramConfig.webAppUrl || 'http://localhost:3000'}/storage/${course.thumbnailKey}`
            : null);

        if (thumbnailUrl && thumbnailUrl.startsWith('https://')) {
          const photoSent = await this.telegramClient.sendPhoto({
            chat_id: chatId,
            photo: thumbnailUrl,
            caption: cardText,
            parse_mode: 'HTML',
            reply_markup: cardButtons,
          });
          if (!photoSent) {
            await this.telegramClient.sendMessage({
              chat_id: chatId,
              text: cardText,
              parse_mode: 'HTML',
              reply_markup: cardButtons,
            });
          }
        } else {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text: cardText,
            parse_mode: 'HTML',
            reply_markup: cardButtons,
          });
        }
      }

      const startIdx = (page - 1) * 5 + 1;
      const endIdx = Math.min(page * 5, total);

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `📚 <b>Browse Courses</b>\n` +
          `Showing ${startIdx}–${endIdx} of ${total} courses (Page ${page} of ${totalPages})`,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildCoursesPaginatedKeyboard(
          page,
          totalPages,
          filterType,
          searchQuery,
          this.telegramConfig.webAppUrl,
        ),
      });
    } catch (error) {
      this.logger.error(`Error in handleCourses:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load the course catalog right now. Please try again later.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * View detailed course information.
   */
  async handleCourseDetail(
    chatId: number,
    telegramUserId: number,
    courseId: string,
  ): Promise<void> {
    try {
      const course = await this.catalogService.publicCourse(courseId);
      if (!course) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `This course is no longer available.`,
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let enrollmentStatus: string | null = null;
      const resolution =
        await this.identityResolver.resolveIdentity(telegramUserId);
      if (resolution.user) {
        const existing = await this.enrollmentsService.mine(
          resolution.user.id,
          { page: 1, pageSize: 50 },
        );
        const match = (existing.items || []).find(
          (e: any) => e.courseId === course.id,
        );
        if (match) enrollmentStatus = match.status;
      }

      let text =
        `📘 <b>${this.formatting.escapeHtml(course.title)}</b>\n\n` +
        `Category: <b>${this.formatting.escapeHtml(course.categoryName || 'General')}</b>\n` +
        `Level: <b>${this.formatting.escapeHtml((course as any).difficulty || 'All Levels')}</b>\n` +
        `Type: <b>${course.accessType === 'FREE' ? 'FREE' : 'PAID'}</b>\n` +
        `Price: <b>${course.accessType === 'FREE' ? 'FREE' : `${course.currency || 'ETB'} ${Number(course.price || 0).toLocaleString()}`}</b>\n` +
        `Lessons: <b>${(course as any).totalLessons || 0} lessons</b>\n\n` +
        `<b>Description:</b>\n${this.formatting.escapeHtml((course.shortDescription || course.description || '').slice(0, 300))}\n\n` +
        `Status: <b>${enrollmentStatus === 'ENROLLED' ? 'Enrolled ✅' : enrollmentStatus === 'PENDING_PAYMENT' ? 'Pending Payment ⏳' : 'Not Enrolled'}</b>`;

      const keyboard = this.keyboard.buildCourseDetailKeyboard(
        course.id,
        enrollmentStatus,
        this.telegramConfig.webAppUrl,
      );

      const thumbnailUrl =
        course.thumbnailUrl ||
        (course.thumbnailKey
          ? `${this.telegramConfig.webAppUrl || 'http://localhost:3000'}/storage/${course.thumbnailKey}`
          : null);

      if (thumbnailUrl && thumbnailUrl.startsWith('https://')) {
        const photoSent = await this.telegramClient.sendPhoto({
          chat_id: chatId,
          photo: thumbnailUrl,
          caption: text,
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
        if (!photoSent) {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            reply_markup: keyboard,
          });
        }
      } else {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        (error as any)?.name === 'NotFoundException' ||
        (error as any)?.status === 404 ||
        (error as any)?.response?.code === 'COURSE_NOT_FOUND'
      ) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `This course is no longer available.`,
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }
      this.logger.error(`Error in handleCourseDetail:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load course details right now.`,
      });
    }
  }

  /**
   * `/mycourses` — Enrolled courses
   */
  async handleMyCourses(
    chatId: number,
    telegramUserId: number,
    page = 1,
  ): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      const result = await this.enrollmentsService.mine(user.id, {
        page,
        pageSize: 5,
        enrollmentStatuses: [
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.IN_PROGRESS,
          EnrollmentStatus.COMPLETED,
        ],
      });
      const enrollments = result.items || [];
      const totalPages = Math.ceil((result.total || 0) / 5) || 1;

      if (enrollments.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `📚 <b>My Courses</b>\n\nYou do not have any active enrolled courses yet.\n\nPending payments can be viewed under 💳 <b>Payments</b>.`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let text = `📚 <b>My Courses</b> (Page ${page} of ${totalPages})\n\n`;
      enrollments.forEach((item, idx) => {
        text += `${idx + 1}. ${this.formatting.formatMyCourseSummary(item)}\n`;
      });

      const enrollmentsDto = enrollments.map((item) => ({
        courseId: item.courseId,
        courseSlug: item.courseSlug,
        courseTitle: item.courseTitle,
      }));

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildMyCoursesKeyboard(
          enrollmentsDto,
          page,
          totalPages,
          this.telegramConfig.webAppUrl,
        ),
      });
    } catch (error) {
      this.logger.error(`Error in handleMyCourses for user ${user.id}:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load your enrolled courses right now.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * `/progress` — Learning progress
   */
  async handleProgress(chatId: number, telegramUserId: number): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      const enrollmentsResult = await this.enrollmentsService.mine(user.id, {
        page: 1,
        pageSize: 10,
        enrollmentStatuses: [
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.IN_PROGRESS,
          EnrollmentStatus.COMPLETED,
        ],
      });
      const enrollments = enrollmentsResult.items || [];

      if (enrollments.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `📈 <b>Learning Progress</b>\n\nYou do not have any active course progress yet.`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let text = `📈 <b>Learning Progress</b>\n\n`;
      let firstSlug: string | undefined;

      for (const item of enrollments) {
        if (!firstSlug && item.courseSlug) firstSlug = item.courseSlug;

        try {
          const overview = await this.learningService.overview(user, item.id);
          text +=
            this.formatting.formatProgressDetail(overview) + `\n\n---\n\n`;
        } catch {
          // If learning access is unavailable for this enrollment (e.g. pending payment), display summary status
          text +=
            `<b>${this.formatting.escapeHtml(item.courseTitle)}</b>\n` +
            `Status: ${this.formatting.escapeHtml(item.status)}\n\n---\n\n`;
        }
      }

      // Trim trailing delimiter
      text = text.replace(/\n\n---\n\n$/, '');

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildProgressKeyboard(
          firstSlug,
          this.telegramConfig.webAppUrl,
        ),
      });
    } catch (error) {
      this.logger.error(`Error in handleProgress for user ${user.id}:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load your learning progress right now.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * `/payments` — Student payments history
   */
  async handlePayments(
    chatId: number,
    telegramUserId: number,
    page = 1,
    paymentId?: string,
  ): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      if (paymentId) {
        // Detail view re-authorizes server side
        const payment = await this.paymentsService.mineDetail(
          user.id,
          paymentId,
        );
        const text = this.formatting.formatPaymentSummary(payment);
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildPaymentsKeyboard(
            [payment],
            1,
            1,
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      const [payments, countResult] = await Promise.all([
        this.paymentsService.mine(user.id, { page, pageSize: 5 }),
        this.paymentsService.mineCount(user.id, { page, pageSize: 5 }),
      ]);
      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / 5) || 1;

      if (!Array.isArray(payments) || payments.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `💳 <b>My Payments</b>\n\nYou don't have any payment records yet.`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildHelpKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let text = `💳 <b>My Payments</b> (Page ${page} of ${totalPages})\n\n`;
      payments.forEach((p, idx) => {
        text += `${idx + 1}. ${this.formatting.formatPaymentSummary(p)}\n\n`;
      });

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildPaymentsKeyboard(
          payments,
          page,
          totalPages,
          this.telegramConfig.webAppUrl,
        ),
      });
    } catch (error) {
      this.logger.error(`Error in handlePayments for user ${user.id}:`, error);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load your payments right now or the requested payment was not found.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * `/certificates` — Student certificates
   */
  async handleCertificates(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      const certificates = await this.certificatesService.listMine(user.id, {
        page: 1,
        pageSize: 10,
      });

      if (!certificates || certificates.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text:
            `🏆 <b>My Certificates</b>\n\n` +
            `You don't have any certificates yet.\n` +
            `Complete eligible courses to earn certificates.`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildHelpKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let text = `🏆 <b>My Certificates</b>\n\n`;
      certificates.forEach((cert, idx) => {
        text += `${idx + 1}. ${this.formatting.formatCertificateSummary(cert)}\n\n`;
      });

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildCertificatesKeyboard(
          certificates,
          this.telegramConfig.webAppUrl,
        ),
      });
    } catch (error) {
      this.logger.error(
        `Error in handleCertificates for user ${user.id}:`,
        error,
      );
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load your certificates right now.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * `/notifications` — Read existing LMS notifications
   */
  async handleNotifications(
    chatId: number,
    telegramUserId: number,
    page = 1,
  ): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      const result = await this.notificationsService.listMine(user.id, {
        page,
        pageSize: 5,
      });
      const notifications = result.items || [];
      const totalPages = result.totalPages || 1;

      if (notifications.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `🔔 <b>Notifications</b>\n\nYou're all caught up.\nNo notifications to show.`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildHelpKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let text = `🔔 <b>Notifications</b> (Page ${page} of ${totalPages})\n\n`;
      notifications.forEach((n, idx) => {
        text += `${idx + 1}. ${this.formatting.formatNotificationItem(n)}\n\n`;
      });

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildNotificationsKeyboard(
          page,
          totalPages,
          this.telegramConfig.webAppUrl,
        ),
      });
    } catch (error) {
      this.logger.error(
        `Error in handleNotifications for user ${user.id}:`,
        error,
      );
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load your notifications right now.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * `/settings`
   */
  async handleSettings(chatId: number, telegramUserId: number): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    const text =
      `⚙️ <b>Telegram Settings</b>\n\n` +
      `<b>Account:</b> Connected ✅\n` +
      `<b>Telegram Notifications:</b> Default (All enabled)`;

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: this.keyboard.buildSettingsKeyboard(
        this.telegramConfig.webAppUrl,
      ),
    });
  }

  /**
   * `/unlink` or `student_unlink` callback
   */
  async handleUnlink(chatId: number, telegramUserId: number): Promise<void> {
    const resolution =
      await this.identityResolver.resolveIdentity(telegramUserId);

    if (resolution.status === 'LINKED' && resolution.user) {
      await this.linkService.unlinkTelegramAccount(resolution.user.id);

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `🔓 <b>Telegram Account Disconnected</b>\n\n` +
          `Your Telegram account has been unlinked from your Joel Talargie Academy profile.`,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildUnlinkedKeyboard(),
      });
      return;
    }

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: `Your Telegram account is not connected to an academy account.`,
      parse_mode: 'HTML',
      reply_markup: this.keyboard.buildUnlinkedKeyboard(),
    });
  }
}
