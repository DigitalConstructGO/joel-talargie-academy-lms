import { Injectable } from '@nestjs/common';

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
  formatAccount(user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    status: string;
    roles: string[];
  }): string {
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student';
    const maskedEmail = this.maskEmail(user.email);
    const rolesList = user.roles.join(', ') || 'Student';
    const statusDisplay =
      user.status === 'ACTIVE' ? 'Active ✅' : this.escapeHtml(user.status);

    return (
      `👤 <b>My Academy Account</b>\n\n` +
      `<b>Name:</b> ${this.escapeHtml(name)}\n` +
      `<b>Email:</b> ${this.escapeHtml(maskedEmail)}\n` +
      `<b>Role:</b> ${this.escapeHtml(rolesList)}\n` +
      `<b>Telegram:</b> Connected ✅\n` +
      `<b>Account Status:</b> ${statusDisplay}`
    );
  }

  /**
   * Formats a course card summary for browsing catalog.
   */
  formatCourseCard(course: {
    title: string;
    accessType?: string;
    price?: string | number;
    discountPrice?: string | number | null;
    currency?: string;
    categoryName?: string | null;
    difficulty?: string | null;
  }): string {
    const isFree =
      course.accessType === 'FREE' || Number(course.price || 0) === 0;
    const priceDisplay = isFree
      ? 'FREE'
      : `${this.escapeHtml(course.currency || 'ETB')} ${Number(course.discountPrice || course.price || 0).toLocaleString()}`;

    return (
      `📚 <b>${this.escapeHtml(course.title)}</b>\n\n` +
      `<b>Category:</b> ${this.escapeHtml(course.categoryName || 'General')}\n` +
      `<b>Price:</b> ${priceDisplay}\n` +
      `<b>Type:</b> ${isFree ? 'Free' : 'Paid'}`
    );
  }

  /**
   * Formats my-enrolled course item.
   */
  formatMyCourseSummary(item: {
    courseTitle: string;
    status: string;
    progressPercentage?: number;
  }): string {
    const progress = item.progressPercentage ?? 0;
    const bar = this.formatProgressBar(progress);
    const statusLabel = this.formatEnrollmentStatus(item.status);

    return (
      `📚 <b>${this.escapeHtml(item.courseTitle)}</b>\n` +
      `Progress: ${bar}\n` +
      `Status: ${statusLabel}\n`
    );
  }

  /**
   * Formats detailed learning progress for a course.
   */
  formatProgressDetail(overview: {
    course: { title: string };
    progressPercentage: number;
    mandatoryLessonCount: number;
    completedMandatoryLessonCount: number;
    enrollmentStatus: string;
  }): string {
    const bar = this.formatProgressBar(overview.progressPercentage);
    const statusLabel = this.formatEnrollmentStatus(overview.enrollmentStatus);

    return (
      `📈 <b>Learning Progress</b>\n\n` +
      `<b>${this.escapeHtml(overview.course.title)}</b>\n` +
      `${bar}\n\n` +
      `${overview.completedMandatoryLessonCount} / ${overview.mandatoryLessonCount} required lessons completed\n\n` +
      `<b>Status:</b> ${statusLabel}`
    );
  }

  /**
   * Formats a single payment record summary.
   */
  formatPaymentSummary(payment: {
    courseTitle?: string;
    submittedAmount?: string | number;
    expectedAmount?: string | number;
    amount?: string | number;
    currency?: string;
    status: string;
    createdAt?: Date | string;
    submittedAt?: Date | string;
    paymentDate?: Date | string;
  }): string {
    const amountVal =
      payment.submittedAmount ?? payment.amount ?? payment.expectedAmount ?? 0;
    const amountDisplay = `${this.escapeHtml(payment.currency || 'ETB')} ${Number(amountVal).toLocaleString()}`;
    const dateVal =
      payment.submittedAt || payment.paymentDate || payment.createdAt;
    const formattedDate = dateVal
      ? new Date(dateVal).toLocaleDateString()
      : 'N/A';
    const statusDisplay = this.formatPaymentStatus(payment.status);

    return (
      `💳 <b>Payment Summary</b>\n\n` +
      `<b>Course:</b> ${this.escapeHtml(payment.courseTitle || 'Academy Course')}\n` +
      `<b>Amount:</b> ${amountDisplay}\n` +
      `<b>Status:</b> ${statusDisplay}\n` +
      `<b>Date:</b> ${formattedDate}`
    );
  }

  /**
   * Formats a single certificate summary.
   */
  formatCertificateSummary(cert: {
    courseTitle?: string;
    certificateNumber?: string;
    status: string;
    issuedAt?: Date | string;
    createdAt?: Date | string;
  }): string {
    const dateVal = cert.issuedAt || cert.createdAt;
    const formattedDate = dateVal
      ? new Date(dateVal).toLocaleDateString()
      : 'N/A';
    const isAvailable = cert.status === 'GENERATED';

    return (
      `🏆 <b>My Certificate</b>\n\n` +
      `<b>Course:</b> ${this.escapeHtml(cert.courseTitle || 'Academy Course')}\n` +
      `<b>Issued:</b> ${formattedDate}\n` +
      `<b>Certificate:</b> ${isAvailable ? 'Available ✅' : this.escapeHtml(cert.status)}`
    );
  }

  /**
   * Formats a single notification item.
   */
  formatNotificationItem(notif: {
    title: string;
    body?: string;
    message?: string;
    createdAt: Date | string;
    readAt?: Date | string | null;
  }): string {
    const text = notif.body || notif.message || '';
    const readBadge = notif.readAt ? ' (Read)' : ' 🟢 (New)';
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

  private formatEnrollmentStatus(status: string): string {
    switch (status) {
      case 'ENROLLED':
        return 'Enrolled';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed 🎉';
      case 'PENDING_PAYMENT':
        return 'Pending Payment ⏳';
      case 'WAITING_APPROVAL':
        return 'Waiting Payment Approval ⏳';
      case 'CANCELLED':
        return 'Cancelled';
      case 'ACCESS_REVOKED':
        return 'Access Revoked';
      default:
        return this.escapeHtml(status);
    }
  }

  private formatPaymentStatus(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'WAITING_APPROVAL':
        return 'Pending Review ⏳';
      case 'APPROVED':
      case 'SUCCESS':
        return 'Approved ✅';
      case 'DECLINED':
      case 'REJECTED':
        return 'Declined ❌';
      case 'FAILED':
        return 'Failed ❌';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return this.escapeHtml(status);
    }
  }
}
