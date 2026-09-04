import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  getTelegramUserLanguage,
  setTelegramUserLanguage,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
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
import {
  TelegramKeyboardService,
  isValidTelegramButtonUrl,
} from './telegram-keyboard.service';
import { getTranslations, TelegramLanguage } from './telegram-i18n';

import { TelegramLinkService } from './telegram-link.service';

@Injectable()
export class TelegramStudentService {
  private readonly logger = new Logger(TelegramStudentService.name);
  private userLanguages = new Map<string, TelegramLanguage>();

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
    @Optional()
    @Inject(DatabaseService)
    private readonly database?: DatabaseService,
  ) {}

  async getUserLanguage(
    telegramUserId: number | string,
  ): Promise<TelegramLanguage> {
    const key = String(telegramUserId);
    if (this.database) {
      try {
        const lang = await getTelegramUserLanguage(this.database.client, key);
        this.userLanguages.set(key, lang);
        return lang;
      } catch {
        // fallback
      }
    }
    return this.userLanguages.get(key) || 'en';
  }

  async setUserLanguage(
    telegramUserId: number | string,
    lang: TelegramLanguage,
  ): Promise<TelegramLanguage> {
    const key = String(telegramUserId);
    this.userLanguages.set(key, lang);
    if (this.database) {
      try {
        await setTelegramUserLanguage(this.database.client, key, lang);
      } catch {
        // fallback
      }
    }
    return lang;
  }

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
      const lang = await this.getUserLanguage(telegramUserId);
      const t = getTranslations(lang);
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `${t.unlinkedWelcomeTitle}\n\n` + `${t.unlinkedWelcomeBody}`,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildUnlinkedKeyboard(lang),
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
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
    const resolution =
      await this.identityResolver.resolveIdentity(telegramUserId);

    if (resolution.status === 'LINKED' && resolution.user) {
      const name = resolution.user.firstName || firstName || 'Student';
      const welcomeText = t.welcomeBack(this.formatting.escapeHtml(name));

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildStudentMainMenuKeyboard(
          this.telegramConfig.webAppUrl,
          lang,
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
      text: `${t.unlinkedWelcomeTitle}\n\n` + `${t.unlinkedWelcomeBody}`,
      reply_markup: this.keyboard.buildUnlinkedKeyboard(lang),
    });
  }

  /**
   * `/help`
   */
  async handleHelp(chatId: number, telegramUserId?: number): Promise<void> {
    const lang = telegramUserId
      ? await this.getUserLanguage(telegramUserId)
      : 'en';
    const t = getTranslations(lang);
    const helpText =
      `${t.helpTitle}\n\n` +
      `Available student services:\n\n` +
      `${t.myCourses}\nView your enrolled courses.\n\n` +
      `${t.myProgress}\nCheck your current learning progress.\n\n` +
      `${t.payments}\nView your payment status.\n\n` +
      `${t.certificates}\nView available certificates.\n\n` +
      `${t.notifications}\nView recent academy notifications.\n\n` +
      `${t.myAccount}\nView your academy account summary.`;

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: helpText,
      parse_mode: 'HTML',
      reply_markup: this.keyboard.buildHelpKeyboard(
        this.telegramConfig.webAppUrl,
        lang,
      ),
    });
  }

  /**
   * `/account`
   */
  async handleAccount(chatId: number, telegramUserId: number): Promise<void> {
    const lang = await this.getUserLanguage(telegramUserId);
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
        lang,
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
    const lang = await this.getUserLanguage(chatId);
    const t = getTranslations(lang);

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
          text: `${t.browseCourses}\n\n${t.noCoursesFound}`,
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
        const cardText = this.formatting.formatCourseCard(course, lang);
        const cardButtons = {
          inline_keyboard: [
            [
              {
                text: t.viewDetails,
                callback_data: `course_detail:${course.id}`,
              },
              {
                text: t.enrollNow,
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
          `${t.browseCourses}\n` +
          t.showingCourses(startIdx, endIdx, total, page, totalPages),
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
          lang,
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
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
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
          text: `${t.myEnrolledCoursesTitle}\n\n${t.noEnrolledCourses}`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let text = `${t.myEnrolledCoursesTitle} (Page ${page} of ${totalPages})\n\n`;
      enrollments.forEach((item, idx) => {
        text += `${idx + 1}. ${this.formatting.formatMyCourseSummary(item, lang)}\n`;
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
          lang,
        ),
      });
    }
  }

  /**
   * `/progress` — Learning progress
   */
  async handleProgress(chatId: number, telegramUserId: number): Promise<void> {
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
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
          text: `${t.learningProgressTitle}\n\n${t.noEnrolledCourses}`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildCoursesKeyboard(
            this.telegramConfig.webAppUrl,
          ),
        });
        return;
      }

      let text = `${t.learningProgressTitle}\n\n`;
      let firstSlug: string | undefined;

      for (const item of enrollments) {
        if (!firstSlug && item.courseSlug) firstSlug = item.courseSlug;

        try {
          const overview = await this.learningService.overview(user, item.id);
          text +=
            this.formatting.formatProgressDetail(overview, lang) +
            `\n\n---\n\n`;
        } catch {
          // If learning access is unavailable for this enrollment (e.g. pending payment), display summary status
          text +=
            `<b>${this.formatting.escapeHtml(item.courseTitle)}</b>\n` +
            `${t.statusLabel}: ${this.formatting.escapeHtml(item.status)}\n\n---\n\n`;
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
          lang,
        ),
      });
    }
  }

  /**
   * View Curriculum & Sections for an enrolled course
   */
  async handleCourseCurriculum(
    chatId: number,
    telegramUserId: number,
    targetId: string,
  ): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      let overview: Awaited<ReturnType<LearningService['overview']>>;
      let actualEnrollmentId = targetId;

      try {
        overview = await this.learningService.overview(user, targetId);
      } catch (error) {
        const mineResult = await this.enrollmentsService.mine(user.id, {
          page: 1,
          pageSize: 50,
          enrollmentStatuses: [
            EnrollmentStatus.ENROLLED,
            EnrollmentStatus.IN_PROGRESS,
            EnrollmentStatus.COMPLETED,
          ],
        });
        const matched = (mineResult.items || []).find(
          (e) =>
            e.id === targetId ||
            e.courseId === targetId ||
            e.courseSlug === targetId,
        );
        if (matched) {
          actualEnrollmentId = matched.id;
          overview = await this.learningService.overview(user, matched.id);
        } else {
          throw error;
        }
      }

      const sections = overview.curriculum || [];
      const allLessons = sections.flatMap((sec) => sec.lessons || []);
      const completedLessons = allLessons.filter(
        (l) => l.progressStatus === 'COMPLETED' || l.isCompleted,
      );

      let text =
        `📚 <b>${this.formatting.escapeHtml(overview.course?.title || 'Course Content')}</b>\n\n` +
        `Progress: <b>${overview.progressPercentage}%</b> (${completedLessons.length}/${allLessons.length} lessons completed)\n\n` +
        `<b>Course Sections & Lessons:</b>\n`;

      const keyboard: Array<
        Array<{ text: string; callback_data?: string; url?: string }>
      > = [];

      sections.forEach((sec, sIdx) => {
        text += `\n<b>Section ${sIdx + 1}: ${this.formatting.escapeHtml(sec.title)}</b>\n`;
        (sec.lessons || []).forEach((les, lIdx) => {
          const isDone = les.progressStatus === 'COMPLETED' || les.isCompleted;
          const statusIcon = isDone ? '✅' : '📖';
          text += `  ${statusIcon} ${lIdx + 1}. ${this.formatting.escapeHtml(les.title)}\n`;

          keyboard.push([
            {
              text: `${statusIcon} ${les.title.slice(0, 30)}`,
              callback_data: `view_lesson:${les.id}`,
            },
          ]);
        });
      });

      if (overview.progressPercentage >= 100) {
        keyboard.push([
          {
            text: '📜 View Certificate',
            callback_data: 'student_certificates',
          },
        ]);
      }

      keyboard.push([
        { text: '⬅️ Back to My Courses', callback_data: 'student_my_courses' },
      ]);

      const course = overview.course as any;
      const thumbnailUrl =
        course?.thumbnailUrl ||
        (course?.thumbnailKey
          ? `${this.telegramConfig.webAppUrl || 'http://localhost:3000'}/storage/${course.thumbnailKey}`
          : null);

      if (thumbnailUrl && thumbnailUrl.startsWith('https://')) {
        const photoSent = await this.telegramClient.sendPhoto({
          chat_id: chatId,
          photo: thumbnailUrl,
          caption: text.trim(),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard },
        });
        if (!photoSent) {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text: text.trim(),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard },
          });
        }
      } else {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: text.trim(),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error in handleCourseCurriculum for user ${user.id}:`,
        error,
      );
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load course content right now. Please try again later.`,
        reply_markup: this.keyboard.buildHelpKeyboard(
          this.telegramConfig.webAppUrl,
        ),
      });
    }
  }

  /**
   * View single lesson details & non-downloadable YouTube video stream link
   */
  async handleLessonDetail(
    chatId: number,
    telegramUserId: number,
    enrollmentId: string | null,
    lessonId: string,
  ): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      const mineResult = await this.enrollmentsService.mine(user.id, {
        page: 1,
        pageSize: 50,
        enrollmentStatuses: [
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.IN_PROGRESS,
          EnrollmentStatus.COMPLETED,
        ],
      });

      let matchedEnrollmentId = enrollmentId;
      if (!matchedEnrollmentId) {
        for (const item of mineResult.items || []) {
          try {
            const overview = await this.learningService.overview(user, item.id);
            const hasLesson = (overview.curriculum || []).some((sec) =>
              (sec.lessons || []).some((l) => l.id === lessonId),
            );
            if (hasLesson) {
              matchedEnrollmentId = item.id;
              break;
            }
          } catch {}
        }
      }

      if (!matchedEnrollmentId && mineResult.items?.[0]) {
        matchedEnrollmentId = mineResult.items[0].id;
      }

      if (!matchedEnrollmentId) {
        throw new NotFoundException('ENROLLMENT_NOT_FOUND');
      }

      const lessonDetail = await this.learningService.open(
        user,
        matchedEnrollmentId,
        lessonId,
      );

      const isDone =
        (lessonDetail as any).progressStatus === 'COMPLETED' ||
        (lessonDetail as any).isCompleted;
      const durationMins = Math.ceil(
        (lessonDetail.durationSeconds || 300) / 60,
      );

      const TYPE_ICONS: Record<string, string> = {
        VIDEO: '📹 Video Lesson',
        TEXT: '📄 Text / Reading',
        ARTICLE: '📄 Article',
        READING: '📖 Reading Material',
        DOCUMENT: '📁 File / Document',
        QUIZ: '❓ Quiz',
        EXTERNAL_LINK: '🔗 External Resource',
      };
      const typeBadge =
        TYPE_ICONS[lessonDetail.lessonType] ||
        `📖 ${lessonDetail.lessonType || 'Lesson'}`;

      const videoLink = lessonDetail.videoUrl || lessonDetail.externalUrl;
      let text = '';

      // Embedded zero-width space link so Telegram auto-embeds native in-chat video preview frame
      if (videoLink && videoLink.startsWith('https://')) {
        text += `<a href="${videoLink}">&#8203;</a>`;
      }

      text +=
        `📖 <b>Lesson: ${this.formatting.escapeHtml(lessonDetail.title)}</b>\n` +
        `Type: <b>${typeBadge}</b>\n` +
        `Duration: <b>${durationMins} mins</b>\n` +
        `Status: <b>${isDone ? 'Completed ✅' : 'In Progress ⏳'}</b>\n\n`;

      if (videoLink) {
        text +=
          `📺 <b>Video Stream:</b> ${videoLink}\n\n` +
          `<i>Note: Tap the video preview card above or button below to stream live directly inside Telegram. Streaming is non-downloadable.</i>\n\n`;
      }

      if (lessonDetail.content) {
        let cleanText = lessonDetail.content
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<\/h[1-6]>/gi, '\n\n')
          .replace(/<\/li>/gi, '\n')
          .replace(/<li[^>]*>/gi, '• ')
          .replace(/<(?!\/?(b|i|u|s|code|pre|a)(\s|>))[^>]+>/gi, '')
          .trim();

        if (cleanText.length > 800) {
          cleanText = cleanText.slice(0, 800) + '...';
        }

        if (cleanText) {
          text += `📝 <b>Lesson Content & Notes:</b>\n${cleanText}\n\n`;
        }
      }

      const resources = (lessonDetail as any).resources || [];
      if (resources.length > 0) {
        text += `📎 <b>Attached Files & Downloads (${resources.length}):</b>\n`;
        resources.forEach((res: any, idx: number) => {
          text += `  ${idx + 1}. 📄 <b>${this.formatting.escapeHtml(res.label || 'Attached File')}</b>\n`;
        });
        text += '\n';
      }

      const inline_keyboard: Array<
        Array<{
          text: string;
          callback_data?: string;
          url?: string;
          web_app?: { url: string };
        }>
      > = [];

      if (videoLink && videoLink.startsWith('https://')) {
        const webPlayerUrl =
          this.telegramConfig.webAppUrl &&
          this.telegramConfig.webAppUrl.startsWith('https://')
            ? `${this.telegramConfig.webAppUrl}/dashboard/courses/${matchedEnrollmentId}/learn?lesson=${lessonId}`
            : null;

        const videoRow: Array<{
          text: string;
          callback_data?: string;
          url?: string;
          web_app?: { url: string };
        }> = [];

        if (webPlayerUrl) {
          videoRow.push({
            text: '▶️ Play in Telegram',
            web_app: { url: webPlayerUrl },
          });
        }

        videoRow.push({
          text: '📺 Watch Stream',
          url: videoLink,
        });

        inline_keyboard.push(videoRow);
      }

      if (resources.length > 0) {
        resources.forEach((res: any) => {
          if (res.externalUrl && res.externalUrl.startsWith('https://')) {
            inline_keyboard.push([
              {
                text: `📥 Download ${res.label ? res.label.slice(0, 22) : 'File'}`,
                url: res.externalUrl,
              },
            ]);
          }
        });
      }

      if (!isDone) {
        inline_keyboard.push([
          {
            text: '✅ Mark as Complete',
            callback_data: `complete_lesson:${lessonId}`,
          },
        ]);
      } else {
        inline_keyboard.push([
          {
            text: '✅ Lesson Completed',
            callback_data: `course_curriculum:${matchedEnrollmentId}`,
          },
        ]);
      }

      inline_keyboard.push([
        {
          text: '⬅️ Back to Curriculum',
          callback_data: `course_curriculum:${matchedEnrollmentId}`,
        },
      ]);

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard },
      });
    } catch (error) {
      this.logger.error(
        `Error in handleLessonDetail for user ${user.id}:`,
        error,
      );
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `We couldn't load lesson details right now.`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⬅️ Back to My Courses',
                callback_data: 'student_my_courses',
              },
            ],
          ],
        },
      });
    }
  }

  /**
   * Mark lesson complete & update progress. Auto-issue certificate on 100%!
   */
  async handleCompleteLesson(
    chatId: number,
    telegramUserId: number,
    enrollmentId: string | null,
    lessonId: string,
  ): Promise<void> {
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      const mineResult = await this.enrollmentsService.mine(user.id, {
        page: 1,
        pageSize: 50,
        enrollmentStatuses: [
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.IN_PROGRESS,
          EnrollmentStatus.COMPLETED,
        ],
      });

      let matchedEnrollmentId = enrollmentId;
      if (!matchedEnrollmentId) {
        for (const item of mineResult.items || []) {
          try {
            const overview = await this.learningService.overview(user, item.id);
            const hasLesson = (overview.curriculum || []).some((sec) =>
              (sec.lessons || []).some((l) => l.id === lessonId),
            );
            if (hasLesson) {
              matchedEnrollmentId = item.id;
              break;
            }
          } catch {}
        }
      }

      if (!matchedEnrollmentId && mineResult.items?.[0]) {
        matchedEnrollmentId = mineResult.items[0].id;
      }

      if (!matchedEnrollmentId) {
        throw new NotFoundException('ENROLLMENT_NOT_FOUND');
      }

      let res: Awaited<ReturnType<LearningService['complete']>>;

      try {
        res = await this.learningService.complete(
          user,
          matchedEnrollmentId,
          lessonId,
        );
      } catch (error: any) {
        const isVideoNotCompleted =
          error?.response?.code === 'VIDEO_NOT_COMPLETED' ||
          error?.code === 'VIDEO_NOT_COMPLETED' ||
          String(error?.message || '').includes('video');

        if (isVideoNotCompleted) {
          try {
            const lessonDetail = await this.learningService.open(
              user,
              matchedEnrollmentId,
              lessonId,
            );
            const duration = lessonDetail.durationSeconds || 300;
            await this.learningService.position(
              user,
              matchedEnrollmentId,
              lessonId,
              duration,
            );
            res = await this.learningService.complete(
              user,
              matchedEnrollmentId,
              lessonId,
            );
          } catch {
            throw error;
          }
        } else {
          throw error;
        }
      }

      const overview = await this.learningService.overview(
        user,
        matchedEnrollmentId,
      );
      const is100Percent =
        overview.progressPercentage >= 100 || res.courseCompleted;

      if (is100Percent) {
        let generatedCert: any = null;
        let generatedCertId: string | null = null;
        try {
          const resCert = await this.certificatesService.request(
            user,
            matchedEnrollmentId,
          );
          generatedCert = (resCert as any)?.certificate || resCert;
          generatedCertId = generatedCert?.id || null;
        } catch {
          try {
            const certs = await this.certificatesService.listMine(user.id, {
              page: 1,
              pageSize: 50,
            });
            generatedCert = certs?.find(
              (c: any) => c.enrollmentId === matchedEnrollmentId,
            );
            generatedCertId = generatedCert?.id || null;
          } catch {}
        }

        let pdfResult: { url: string; fileName: string } | null = null;
        if (generatedCertId) {
          try {
            pdfResult = await this.certificatesService.studentDownload(
              user.id,
              generatedCertId,
              false,
            );
          } catch {}
        }

        const viewCertCallback = generatedCertId
          ? `cert_detail:${generatedCertId}`
          : 'student_certificates';

        const captionText =
          `🎉 <b>CONGRATULATIONS!</b>\n\n` +
          `You have completed <b>100%</b> of <b>${this.formatting.escapeHtml(overview.course?.title || 'the course')}</b>!\n\n` +
          `Your official Certificate of Completion has been generated and is attached below! 📜`;

        const inline_keyboard: Array<
          Array<{ text: string; callback_data?: string; url?: string }>
        > = [
          [
            {
              text: '📜 View Certificate Details',
              callback_data: viewCertCallback,
            },
          ],
        ];

        const hasPdfUrl = isValidTelegramButtonUrl(pdfResult?.url);

        if (hasPdfUrl) {
          inline_keyboard.push([
            { text: '📥 Download PDF File', url: pdfResult!.url },
          ]);
        }
        inline_keyboard.push([
          { text: '📚 My Courses', callback_data: 'student_my_courses' },
        ]);

        if (hasPdfUrl) {
          const docSent = await this.telegramClient.sendDocument({
            chat_id: chatId,
            document: pdfResult!.url,
            caption: captionText.trim(),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard },
          });
          if (!docSent) {
            await this.telegramClient.sendMessage({
              chat_id: chatId,
              text: captionText.trim(),
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard },
            });
          }
        } else {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text: captionText.trim(),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard },
          });
        }
        return;
      }

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text:
          `✅ <b>Lesson Marked Complete!</b>\n\n` +
          `Course Progress: <b>${overview.progressPercentage}%</b>`,
        parse_mode: 'HTML',
      });

      // Refresh curriculum view
      await this.handleCourseCurriculum(
        chatId,
        telegramUserId,
        matchedEnrollmentId,
      );
    } catch (error) {
      this.logger.error(
        `Error in handleCompleteLesson for user ${user.id}:`,
        error,
      );
      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: `Could not mark lesson complete. Please try again.`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⬅️ Back to My Courses',
                callback_data: 'student_my_courses',
              },
            ],
          ],
        },
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
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      if (paymentId) {
        // Detail view re-authorizes server side
        const payment = await this.paymentsService.mineDetail(
          user.id,
          paymentId,
        );
        const text = this.formatting.formatPaymentSummary(payment, lang);
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
          text: `${t.paymentRecordsTitle}\n\n${t.noPaymentsFound}`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildHelpKeyboard(
            this.telegramConfig.webAppUrl,
            lang,
          ),
        });
        return;
      }

      let text = `${t.paymentRecordsTitle} (Page ${page} of ${totalPages})\n\n`;
      payments.forEach((p, idx) => {
        text += `${idx + 1}. ${this.formatting.formatPaymentSummary(p, lang)}\n\n`;
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
          lang,
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
    page = 1,
    certificateId?: string,
  ): Promise<void> {
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    try {
      if (certificateId) {
        const cert = await this.certificatesService.mine(
          user.id,
          certificateId,
        );
        let pdfResult: { url: string; fileName: string } | null = null;
        try {
          pdfResult = await this.certificatesService.studentDownload(
            user.id,
            certificateId,
            false,
          );
        } catch {}

        const issueDate = cert.issuedAt
          ? new Date(cert.issuedAt).toLocaleDateString(
              lang === 'am' ? 'am-ET' : 'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )
          : 'Recently';

        const captionText =
          `📜 <b>Certificate of Completion</b>\n\n` +
          `Course: <b>${this.formatting.escapeHtml(cert.courseTitle)}</b>\n` +
          `Student: <b>${this.formatting.escapeHtml(cert.studentName)}</b>\n` +
          `Certificate Code: <code>${this.formatting.escapeHtml(cert.certificateNumber)}</code>\n` +
          `Issued Date: <b>${issueDate}</b>\n\n` +
          `<i>Your official PDF certificate file is attached below. You can open and save it directly to your phone/PC.</i>`;

        const inline_keyboard: Array<
          Array<{ text: string; callback_data?: string; url?: string }>
        > = [];

        const hasPdfUrl = isValidTelegramButtonUrl(pdfResult?.url);
        const hasVerificationUrl = isValidTelegramButtonUrl(
          cert.verificationUrl,
        );

        if (hasPdfUrl) {
          inline_keyboard.push([
            { text: '📥 Download PDF File', url: pdfResult!.url },
          ]);
        }
        if (hasVerificationUrl) {
          inline_keyboard.push([
            { text: '🔍 Verify Online', url: cert.verificationUrl! },
          ]);
        }
        inline_keyboard.push([
          {
            text: t.back,
            callback_data: 'student_certificates',
          },
        ]);

        if (hasPdfUrl) {
          const docSent = await this.telegramClient.sendDocument({
            chat_id: chatId,
            document: pdfResult!.url,
            caption: captionText.trim(),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard },
          });
          if (!docSent) {
            await this.telegramClient.sendMessage({
              chat_id: chatId,
              text: captionText.trim(),
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard },
            });
          }
        } else {
          await this.telegramClient.sendMessage({
            chat_id: chatId,
            text: captionText.trim(),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard },
          });
        }
        return;
      }

      // Auto-Healing: Backfill missing certificates for any 100% completed courses
      try {
        const mineEnrollments = await this.enrollmentsService.mine(user.id, {
          page: 1,
          pageSize: 100,
          enrollmentStatuses: [
            EnrollmentStatus.ENROLLED,
            EnrollmentStatus.IN_PROGRESS,
            EnrollmentStatus.COMPLETED,
          ],
        });

        const initialCerts = await this.certificatesService.listMine(user.id, {
          page: 1,
          pageSize: 100,
        });

        const existingCertEnrollmentIds = new Set(
          (initialCerts || []).map((c: any) => c.enrollmentId),
        );

        const enrollmentList = Array.isArray(mineEnrollments)
          ? mineEnrollments
          : (mineEnrollments as any)?.items || [];

        for (const item of enrollmentList) {
          if (!existingCertEnrollmentIds.has(item.id)) {
            try {
              const overview = await this.learningService.overview(
                user,
                item.id,
              );
              if (
                item.status === EnrollmentStatus.COMPLETED ||
                overview.progressPercentage >= 100
              ) {
                await this.certificatesService.request(user, item.id);
              }
            } catch (err) {
              this.logger.warn(
                `Failed to request certificate for enrollment ${item.id}: ${err}`,
              );
            }
          }
        }
      } catch (backfillErr) {
        this.logger.warn(
          `Auto-backfill certificates check warning: ${backfillErr}`,
        );
      }

      const rawCerts = await this.certificatesService.listMine(user.id, {
        page: 1,
        pageSize: 100,
      });

      const certList = Array.isArray(rawCerts)
        ? rawCerts
        : (rawCerts as any)?.items || [];
      const totalCount = certList.length;
      const totalPages = Math.ceil(totalCount / 5) || 1;
      const currentPage = Math.max(1, Math.min(page, totalPages));
      const pagedCertificates = certList.slice(
        (currentPage - 1) * 5,
        currentPage * 5,
      );

      if (pagedCertificates.length === 0) {
        await this.telegramClient.sendMessage({
          chat_id: chatId,
          text: `${t.myCertificatesTitle}\n\n${t.noCertificatesFound}`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildHelpKeyboard(
            this.telegramConfig.webAppUrl,
            lang,
          ),
        });
        return;
      }

      let text = `${t.myCertificatesTitle} (Page ${currentPage} of ${totalPages})\n\n`;
      pagedCertificates.forEach((cert, idx) => {
        text += `${idx + 1}. ${this.formatting.formatCertificateSummary(cert, lang)}\n\n`;
      });

      await this.telegramClient.sendMessage({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: 'HTML',
        reply_markup: this.keyboard.buildCertificatesKeyboard(
          pagedCertificates,
          currentPage,
          totalPages,
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
          lang,
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
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
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
          text: `${t.notificationsTitle}\n\n${t.noNotificationsFound}`,
          parse_mode: 'HTML',
          reply_markup: this.keyboard.buildHelpKeyboard(
            this.telegramConfig.webAppUrl,
            lang,
          ),
        });
        return;
      }

      let text = `${t.notificationsTitle} (Page ${page} of ${totalPages})\n\n`;
      notifications.forEach((n, idx) => {
        text += `${idx + 1}. ${this.formatting.formatNotificationItem(n, lang)}\n\n`;
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
          lang,
        ),
      });
    }
  }

  /**
   * `/settings`
   */
  async handleSettings(chatId: number, telegramUserId: number): Promise<void> {
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
    const user = await this.resolveStudentUser(chatId, telegramUserId);
    if (!user) return;

    const currentLangLabel = lang === 'am' ? '🇪🇹 አማርኛ (Amharic)' : '🇺🇸 English';

    const text =
      `${t.settingsTitle}\n\n` +
      `<b>Account:</b> Connected ✅\n` +
      `<b>Active Language / ቋንቋ:</b> ${currentLangLabel}\n` +
      `<b>Telegram Notifications:</b> Default (All enabled)`;

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: this.keyboard.buildSettingsKeyboard(
        this.telegramConfig.webAppUrl,
        lang,
      ),
    });
  }

  /**
   * Prompt user to select preferred language (English or Amharic)
   */
  async handlePromptLanguage(
    chatId: number,
    telegramUserId: number,
  ): Promise<void> {
    const lang = await this.getUserLanguage(telegramUserId);
    const t = getTranslations(lang);
    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: t.selectLanguageTitle,
      parse_mode: 'Markdown',
      reply_markup: this.keyboard.buildLanguageSelectionKeyboard(lang),
    });
  }

  /**
   * Set user preferred language and notify user
   */
  async handleSetLanguage(
    chatId: number,
    telegramUserId: number,
    newLang: 'en' | 'am',
  ): Promise<void> {
    const updatedLang = await this.setUserLanguage(telegramUserId, newLang);
    const t = getTranslations(updatedLang);

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: `✅ ${t.languageChangedSuccess}`,
      parse_mode: 'HTML',
    });

    await this.handleStart(chatId, telegramUserId);
  }

  /**
   * `/unlink` or `student_unlink` callback
   */
  async handleUnlink(chatId: number, telegramUserId: number): Promise<void> {
    const lang = await this.getUserLanguage(telegramUserId);
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
        reply_markup: this.keyboard.buildUnlinkedKeyboard(lang),
      });
      return;
    }

    await this.telegramClient.sendMessage({
      chat_id: chatId,
      text: `Your Telegram account is not connected to an academy account.`,
      parse_mode: 'HTML',
      reply_markup: this.keyboard.buildUnlinkedKeyboard(lang),
    });
  }
}
