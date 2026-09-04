import { Injectable } from '@nestjs/common';
import { getTranslations, TelegramLanguage } from './telegram-i18n';

@Injectable()
export class TelegramFormattingService {
  /**
   * Safely escapes special HTML characters to prevent Telegram HTML parse mode breakage or XSS/injection.
   */
  escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generates a clean visual progress bar string.
   * Example: 60% -> "██████░░░░ 60%"
   */
  formatProgressBar(percentage: number, barLength = 10): string {
    const safePercentage = Math.max(
      0,
      Math.min(100, Math.round(percentage || 0)),
    );
    const filledCount = Math.round((safePercentage / 100) * barLength);
    const emptyCount = Math.max(0, barLength - filledCount);
    const bar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
    return `${bar} ${safePercentage}%`;
  }

  /**
   * Formats student account summary.
   */
  formatAccount(
    user: {
      firstName?: string | null;
      lastName?: string | null;
      email: string;
      status: string;
      roles: string[];
    },
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student';
    const maskedEmail = this.maskEmail(user.email);
    const rolesList = user.roles.join(', ') || 'Student';
    const statusDisplay =
      user.status === 'ACTIVE' ? t.activeBadge : this.escapeHtml(user.status);

    return (
      `${t.accountTitle}\n\n` +
      `<b>${t.nameLabel}:</b> ${this.escapeHtml(name)}\n` +
      `<b>${t.emailLabel}:</b> ${this.escapeHtml(maskedEmail)}\n` +
      `<b>${t.roleLabel}:</b> ${this.escapeHtml(rolesList)}\n` +
      `<b>${t.telegramStatusLabel}:</b> ${t.connectedBadge}\n` +
      `<b>${t.accountStatusLabel}:</b> ${statusDisplay}`
    );
  }

  /**
   * Formats a course card summary for browsing catalog.
   */
  formatCourseCard(
    course: {
      title: string;
      accessType?: string;
      price?: string | number;
      discountPrice?: string | number | null;
      currency?: string;
      categoryName?: string | null;
      difficulty?: string | null;
    },
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    const isFree =
      course.accessType === 'FREE' || Number(course.price || 0) === 0;
    const priceDisplay = isFree
      ? t.freeLabel
      : `${this.escapeHtml(course.currency || 'ETB')} ${Number(course.discountPrice || course.price || 0).toLocaleString()}`;

    return (
      `📚 <b>${this.escapeHtml(course.title)}</b>\n\n` +
      `<b>${t.categoryLabel}:</b> ${this.escapeHtml(course.categoryName || 'General')}\n` +
      `<b>${t.priceLabel}:</b> ${priceDisplay}\n` +
      `<b>${t.typeLabel}:</b> ${isFree ? t.freeLabel : t.paidLabel}`
    );
  }

  /**
   * Formats my-enrolled course item.
   */
  formatMyCourseSummary(
    item: {
      courseTitle: string;
      status: string;
      progressPercentage?: number;
    },
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    const progress = item.progressPercentage ?? 0;
    const bar = this.formatProgressBar(progress);
    const statusLabel = this.formatEnrollmentStatus(item.status, lang);

    return (
      `📚 <b>${this.escapeHtml(item.courseTitle)}</b>\n` +
      `${t.progressLabel}: ${bar}\n` +
      `${t.statusLabel}: ${statusLabel}\n`
    );
  }

  /**
   * Formats detailed learning progress for a course.
   */
  formatProgressDetail(
    overview: {
      course: { title: string };
      progressPercentage: number;
      mandatoryLessonCount: number;
      completedMandatoryLessonCount: number;
      enrollmentStatus: string;
    },
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    const bar = this.formatProgressBar(overview.progressPercentage);
    const statusLabel = this.formatEnrollmentStatus(
      overview.enrollmentStatus,
      lang,
    );

    return (
      `${t.learningProgressTitle}\n\n` +
      `<b>${this.escapeHtml(overview.course.title)}</b>\n` +
      `${bar}\n\n` +
      `${t.requiredLessonsCompleted(overview.completedMandatoryLessonCount, overview.mandatoryLessonCount)}\n\n` +
      `<b>${t.statusLabel}:</b> ${statusLabel}`
    );
  }

  /**
   * Formats a single payment record summary.
   */
  formatPaymentSummary(
    payment: {
      courseTitle?: string;
      submittedAmount?: string | number;
      expectedAmount?: string | number;
      amount?: string | number;
      currency?: string;
      status: string;
      createdAt?: Date | string;
      submittedAt?: Date | string;
      paymentDate?: Date | string;
    },
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    const amountVal =
      payment.submittedAmount ?? payment.amount ?? payment.expectedAmount ?? 0;
    const amountDisplay = `${this.escapeHtml(payment.currency || 'ETB')} ${Number(amountVal).toLocaleString()}`;
    const dateVal =
      payment.submittedAt || payment.paymentDate || payment.createdAt;
    const formattedDate = dateVal
      ? new Date(dateVal).toLocaleDateString()
      : 'N/A';
    const statusDisplay = this.formatPaymentStatus(payment.status, lang);

    return (
      `${t.paymentSummaryTitle}\n\n` +
      `<b>${t.courseLabel}:</b> ${this.escapeHtml(payment.courseTitle || 'Academy Course')}\n` +
      `<b>${t.amountLabel}:</b> ${amountDisplay}\n` +
      `<b>${t.statusLabel}:</b> ${statusDisplay}\n` +
      `<b>${t.dateLabel}:</b> ${formattedDate}`
    );
  }

  /**
   * Formats a single certificate summary.
   */
  formatCertificateSummary(
    cert: {
      courseTitle?: string;
      certificateNumber?: string;
      status: string;
      issuedAt?: Date | string;
      createdAt?: Date | string;
    },
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    const dateVal = cert.issuedAt || cert.createdAt;
    let formattedDate = 'Recently';
    if (dateVal) {
      const parsedDate = new Date(dateVal);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString(
          lang === 'am' ? 'am-ET' : 'en-US',
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          },
        );
      }
    }
    const isAvailable = cert.status === 'GENERATED';

    return (
      `${t.myCertificateTitle}\n\n` +
      `<b>${t.courseLabel}:</b> ${this.escapeHtml(cert.courseTitle || 'Academy Course')}\n` +
      `<b>${t.issuedLabel}:</b> ${formattedDate}\n` +
      `<b>${t.certificates}:</b> ${isAvailable ? t.certificateAvailableBadge : this.escapeHtml(cert.status)}`
    );
  }

  /**
   * Formats a single notification item.
   */
  formatNotificationItem(
    notif: {
      title: string;
      body?: string;
      message?: string;
      createdAt: Date | string;
      readAt?: Date | string | null;
    },
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    const text = notif.body || notif.message || '';
    const readBadge = notif.readAt ? t.readBadge : t.newBadge;
    const dateStr = notif.createdAt
      ? new Date(notif.createdAt).toLocaleDateString()
      : '';

    return (
      `🔔 <b>${this.escapeHtml(notif.title)}</b>${readBadge}\n` +
      `${this.escapeHtml(text)}\n` +
      `<i>${dateStr}</i>`
    );
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email || '';
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  private formatEnrollmentStatus(
    status: string,
    lang?: TelegramLanguage,
  ): string {
    const t = getTranslations(lang);
    switch (status) {
      case 'ENROLLED':
        return t.statusEnrolled;
      case 'IN_PROGRESS':
        return t.statusInProgress;
      case 'COMPLETED':
        return t.statusCompleted;
      case 'PENDING_PAYMENT':
        return t.statusPendingPayment;
      case 'WAITING_APPROVAL':
        return t.statusWaitingApproval;
      case 'CANCELLED':
        return t.statusCancelled;
      case 'ACCESS_REVOKED':
        return t.statusAccessRevoked;
      default:
        return this.escapeHtml(status);
    }
  }

  private formatPaymentStatus(status: string, lang?: TelegramLanguage): string {
    const t = getTranslations(lang);
    switch (status) {
      case 'PENDING':
      case 'WAITING_APPROVAL':
        return t.paymentPendingReview;
      case 'APPROVED':
      case 'SUCCESS':
        return t.paymentApproved;
      case 'DECLINED':
      case 'REJECTED':
        return t.paymentDeclined;
      case 'FAILED':
        return t.paymentFailed;
      case 'CANCELLED':
        return t.statusCancelled;
      default:
        return this.escapeHtml(status);
    }
  }
}
