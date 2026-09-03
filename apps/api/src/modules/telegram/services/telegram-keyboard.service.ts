import { Injectable } from '@nestjs/common';

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
  [key: string]: unknown;
}

@Injectable()
export class TelegramKeyboardService {
  /**
   * Main Menu keyboard layout for a linked Student.
   */
  buildStudentMainMenuKeyboard(webAppUrl?: string): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [
      [
        { text: '📚 My Courses', callback_data: 'student_my_courses' },
        { text: '📈 My Progress', callback_data: 'student_progress' },
      ],
      [
        { text: '💳 Payments', callback_data: 'student_payments' },
        { text: '🏆 Certificates', callback_data: 'student_certificates' },
      ],
      [
        { text: '🔔 Notifications', callback_data: 'student_notifications' },
        { text: '👤 My Account', callback_data: 'student_account' },
      ],
      [
        { text: '🔍 Browse Courses', callback_data: 'student_courses' },
        { text: '⚙️ Settings', callback_data: 'student_settings' },
      ],
    ];

    const bottomRow: InlineKeyboardButton[] = [];
    if (webAppUrl && webAppUrl.startsWith('https://')) {
      bottomRow.push({
        text: '🌐 Open Academy',
        url: `${webAppUrl}/dashboard`,
      });
    }
    bottomRow.push({ text: '❓ Help', callback_data: 'student_help' });
    keyboard.push(bottomRow);

    return { inline_keyboard: keyboard };
  }

  /**
   * Onboarding keyboard for unlinked Telegram users.
   */
  buildUnlinkedKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: 'Create Account', callback_data: 'register_new' }],
        [
          {
            text: 'Connect Existing Account',
            callback_data: 'connect_existing',
          },
        ],
      ],
    };
  }

  /**
   * Help screen keyboard.
   */
  buildHelpKeyboard(webAppUrl?: string): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];
    if (webAppUrl && webAppUrl.startsWith('https://')) {
      keyboard.push([{ text: 'Open Academy', url: `${webAppUrl}/dashboard` }]);
    }
    keyboard.push([{ text: 'Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }

  /**
   * Account screen keyboard.
   */
  buildAccountKeyboard(webAppUrl?: string): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];
    const profileUrl = webAppUrl ? `${webAppUrl}/dashboard/profile` : null;

    if (profileUrl && profileUrl.startsWith('https://')) {
      keyboard.push([{ text: 'Open Profile', url: profileUrl }]);
    }
    keyboard.push([{ text: 'Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }

  /**
   * Public Catalog Browse keyboard.
   */
  buildCoursesKeyboard(webAppUrl?: string): InlineKeyboardMarkup {
    return this.buildCoursesPaginatedKeyboard(1, 1, null, null, webAppUrl);
  }

  buildCoursesPaginatedKeyboard(
    page: number,
    totalPages: number,
    filterType?: string | null,
    searchQuery?: string | null,
    webAppUrl?: string,
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];

    // Pagination row
    const navRow: InlineKeyboardButton[] = [];
    if (page > 1) {
      navRow.push({
        text: '◀️ Previous',
        callback_data: `courses_page:${page - 1}`,
      });
    }
    if (page < totalPages) {
      navRow.push({
        text: 'Next ▶️',
        callback_data: `courses_page:${page + 1}`,
      });
    }
    if (navRow.length > 0) {
      keyboard.push(navRow);
    }

    // Search and Filter row
    const filterRow: InlineKeyboardButton[] = [
      { text: '🔎 Search', callback_data: 'prompt_course_search' },
      {
        text: filterType ? `🎯 Filter: ${filterType}` : '🎯 Filter',
        callback_data: 'prompt_course_filters',
      },
    ];
    keyboard.push(filterRow);

    if (searchQuery) {
      keyboard.push([
        { text: '❌ Clear Search', callback_data: 'clear_course_search' },
      ]);
    }

    const catalogUrl = webAppUrl
      ? `${webAppUrl}/dashboard/browse-courses`
      : null;
    if (catalogUrl && catalogUrl.startsWith('https://')) {
      keyboard.push([{ text: '🌐 Open Web Catalog', url: catalogUrl }]);
    }
    keyboard.push([{ text: '🏠 Main Menu', callback_data: 'student_menu' }]);

    return { inline_keyboard: keyboard };
  }

  buildCourseDetailKeyboard(
    courseId: string,
    enrollmentStatus?: string | null,
    webAppUrl?: string,
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];
    const courseUrl = webAppUrl
      ? `${webAppUrl}/dashboard/browse-courses`
      : null;

    if (enrollmentStatus === 'ENROLLED') {
      const myCoursesUrl = webAppUrl
        ? `${webAppUrl}/dashboard/my-courses`
        : null;
      if (myCoursesUrl && myCoursesUrl.startsWith('https://')) {
        keyboard.push([{ text: '▶️ Continue Learning', url: myCoursesUrl }]);
      } else {
        keyboard.push([
          { text: '📚 My Courses', callback_data: 'student_my_courses' },
        ]);
      }
    } else if (
      enrollmentStatus === 'PENDING_PAYMENT' ||
      enrollmentStatus === 'WAITING_APPROVAL'
    ) {
      keyboard.push([
        { text: '💳 View Payments', callback_data: 'student_payments' },
      ]);
    } else {
      keyboard.push([
        {
          text: '🚀 Enroll Now',
          callback_data: `start_enrollment:${courseId}`,
        },
      ]);
    }

    if (courseUrl && courseUrl.startsWith('https://')) {
      keyboard.push([{ text: '🌐 Open on Website', url: courseUrl }]);
    }
    keyboard.push([
      { text: '⬅️ Back to Courses', callback_data: 'student_courses' },
    ]);

    return { inline_keyboard: keyboard };
  }

  /**
   * My Courses list keyboard with pagination and web continue buttons.
   */
  buildMyCoursesKeyboard(
    enrollments: Array<{
      enrollmentId?: string;
      courseId: string;
      courseSlug?: string;
      courseTitle?: string;
    }>,
    page: number,
    totalPages: number,
    webAppUrl?: string,
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];

    for (const item of enrollments) {
      const title = (item.courseTitle || 'Course').slice(0, 25);
      const targetId = item.enrollmentId || item.courseId;
      const row: InlineKeyboardButton[] = [
        {
          text: `📖 ${title}`,
          callback_data: `course_curriculum:${targetId}`,
        },
      ];
      const slug = item.courseSlug || item.courseId;
      const courseUrl = webAppUrl
        ? `${webAppUrl}/dashboard/my-courses/${slug}`
        : null;
      if (courseUrl && courseUrl.startsWith('https://')) {
        row.push({
          text: '🌐 Web',
          url: courseUrl,
        });
      }
      keyboard.push(row);
    }

    // Pagination row
    const navRow: InlineKeyboardButton[] = [];
    if (page > 1) {
      navRow.push({
        text: '◀️ Previous',
        callback_data: `mycourses_page:${page - 1}`,
      });
    }
    if (page < totalPages) {
      navRow.push({
        text: 'Next ▶️',
        callback_data: `mycourses_page:${page + 1}`,
      });
    }
    if (navRow.length > 0) {
      keyboard.push(navRow);
    }

    keyboard.push([{ text: '🏠 Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }

  /**
   * Learning Progress detail keyboard.
   */
  buildProgressKeyboard(
    courseSlug?: string,
    webAppUrl?: string,
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];
    const courseUrl =
      webAppUrl && courseSlug
        ? `${webAppUrl}/dashboard/my-courses/${courseSlug}`
        : null;

    if (courseUrl && courseUrl.startsWith('https://')) {
      keyboard.push([{ text: 'Continue Learning', url: courseUrl }]);
    }
    keyboard.push([{ text: 'Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }

  /**
   * Payments list keyboard with pagination.
   */
  buildPaymentsKeyboard(
    payments: Array<{ id: string; courseTitle?: string }>,
    page: number,
    totalPages: number,
    webAppUrl?: string,
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];

    for (const payment of payments) {
      const paymentUrl = webAppUrl
        ? `${webAppUrl}/dashboard/payments/${payment.id}`
        : null;
      if (paymentUrl && paymentUrl.startsWith('https://')) {
        keyboard.push([
          {
            text: `View Payment: ${(payment.courseTitle || 'Payment').slice(0, 25)}`,
            url: paymentUrl,
          },
        ]);
      }
    }

    const navRow: InlineKeyboardButton[] = [];
    if (page > 1) {
      navRow.push({
        text: '◀️ Previous',
        callback_data: `payments_page:${page - 1}`,
      });
    }
    if (page < totalPages) {
      navRow.push({
        text: 'Next ▶️',
        callback_data: `payments_page:${page + 1}`,
      });
    }
    if (navRow.length > 0) {
      keyboard.push(navRow);
    }

    keyboard.push([{ text: 'Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }

  /**
   * Certificates list keyboard.
   */
  buildCertificatesKeyboard(
    certificates: Array<{
      id: string;
      verificationUrl?: string | null;
      downloadAvailable?: boolean;
    }>,
    webAppUrl?: string,
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];

    for (const cert of certificates) {
      const certUrl =
        cert.verificationUrl ||
        (webAppUrl ? `${webAppUrl}/dashboard/certificates/${cert.id}` : null);
      if (certUrl && certUrl.startsWith('https://')) {
        keyboard.push([{ text: 'View Certificate', url: certUrl }]);
      }
    }

    keyboard.push([{ text: 'Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }

  /**
   * Notifications list keyboard with pagination.
   */
  buildNotificationsKeyboard(
    page: number,
    totalPages: number,
    webAppUrl?: string,
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];

    const navRow: InlineKeyboardButton[] = [];
    if (page > 1) {
      navRow.push({
        text: '◀️ Previous',
        callback_data: `notifications_page:${page - 1}`,
      });
    }
    if (page < totalPages) {
      navRow.push({
        text: 'Next ▶️',
        callback_data: `notifications_page:${page + 1}`,
      });
    }
    if (navRow.length > 0) {
      keyboard.push(navRow);
    }

    const notifUrl = webAppUrl ? `${webAppUrl}/dashboard/notifications` : null;
    if (notifUrl && notifUrl.startsWith('https://')) {
      keyboard.push([{ text: 'Open Notifications', url: notifUrl }]);
    }
    keyboard.push([{ text: 'Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }

  /**
   * Settings keyboard.
   */
  buildSettingsKeyboard(webAppUrl?: string): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];
    const settingsUrl = webAppUrl ? `${webAppUrl}/dashboard/profile` : null;

    if (settingsUrl && settingsUrl.startsWith('https://')) {
      keyboard.push([{ text: 'Open Academy Settings', url: settingsUrl }]);
    }
    keyboard.push([
      { text: '🔓 Disconnect Telegram', callback_data: 'student_unlink' },
    ]);
    keyboard.push([{ text: 'Main Menu', callback_data: 'student_menu' }]);
    return { inline_keyboard: keyboard };
  }
}
