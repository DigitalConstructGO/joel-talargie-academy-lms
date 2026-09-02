import { Injectable, UnprocessableEntityException } from '@nestjs/common';
/* eslint-disable no-control-regex */

export const TEMPLATE_PLACEHOLDERS: Record<string, readonly string[]> = {
  EMAIL_VERIFICATION: [
    'recipientName',
    'verificationUrl',
    'expiresInMinutes',
    'academyName',
    'supportEmail',
  ],
  TELEGRAM_REGISTRATION_OTP: [
    'recipientName',
    'otpCode',
    'expiresInMinutes',
    'academyName',
    'supportEmail',
  ],
  TELEGRAM_EXISTING_ACCOUNT_LINK: [
    'recipientName',
    'otpCode',
    'expiresInMinutes',
    'academyName',
    'supportEmail',
  ],
  WELCOME: ['recipientName', 'dashboardUrl', 'academyName', 'supportEmail'],
  PASSWORD_RESET: [
    'recipientName',
    'resetUrl',
    'expiresInMinutes',
    'academyName',
    'supportEmail',
  ],
  PASSWORD_CHANGED: ['recipientName', 'academyName', 'supportEmail'],
  NEW_LOGIN_ALERT: ['recipientName', 'academyName', 'supportEmail'],
  GOOGLE_ACCOUNT_LINKED: ['recipientName', 'academyName', 'supportEmail'],
  GOOGLE_ACCOUNT_UNLINKED: ['recipientName', 'academyName', 'supportEmail'],
  GOOGLE_SIGN_IN: ['recipientName', 'academyName', 'supportEmail'],
  ACCOUNT_ACTIVATED: ['recipientName', 'academyName'],
  ACCOUNT_SUSPENDED: ['recipientName', 'academyName', 'supportEmail'],
  ACCOUNT_ARCHIVED: ['recipientName', 'academyName', 'supportEmail'],
  ACCOUNT_RESTORED: ['recipientName', 'academyName'],
  ROLE_ASSIGNED: ['recipientName', 'roleName', 'academyName'],
  ROLE_REMOVED: ['recipientName', 'roleName', 'academyName'],
  SESSION_REVOKED_BY_ADMIN: ['recipientName', 'academyName', 'supportEmail'],
  FREE_ENROLLMENT_CONFIRMED: [
    'recipientName',
    'courseTitle',
    'dashboardUrl',
    'academyName',
  ],
  PAID_ENROLLMENT_CREATED: [
    'recipientName',
    'courseTitle',
    'paymentUrl',
    'academyName',
  ],
  PAYMENT_SUBMITTED: [
    'recipientName',
    'courseTitle',
    'dashboardUrl',
    'academyName',
  ],
  PAYMENT_APPROVED: [
    'recipientName',
    'courseTitle',
    'amountPaid',
    'amountDiscount',
    'currency',
    'approvedAt',
    'dashboardUrl',
    'academyName',
  ],
  PAYMENT_DECLINED: [
    'recipientName',
    'courseTitle',
    'declineReason',
    'paymentUrl',
    'academyName',
  ],
  COURSE_COMPLETED: [
    'recipientName',
    'courseTitle',
    'dashboardUrl',
    'academyName',
  ],
  CERTIFICATE_READY: [
    'recipientName',
    'courseTitle',
    'certificateNumber',
    'certificateUrl',
    'verificationUrl',
    'academyName',
  ],
  CERTIFICATE_REVOKED: [
    'recipientName',
    'courseTitle',
    'certificateNumber',
    'academyName',
    'supportEmail',
  ],
};

@Injectable()
export class EmailRenderingService {
  render(
    template: {
      code: string;
      subjectTemplate: string;
      htmlTemplate: string;
      textTemplate: string;
    },
    variables: Record<string, string>,
  ) {
    if (/[\r\n]/.test(template.subjectTemplate))
      throw this.invalid('Email subject must not contain line breaks');
    if (
      /<script|<iframe|\son\w+\s*=|javascript:|data:/i.test(
        template.htmlTemplate,
      )
    )
      throw this.invalid('Unsafe email HTML');
    const required = TEMPLATE_PLACEHOLDERS[template.code];
    if (!required) throw this.invalid('Unknown template code');
    const used = new Set(
      [
        template.subjectTemplate,
        template.htmlTemplate,
        template.textTemplate,
      ].flatMap((value) =>
        [...value.matchAll(/{{\s*([A-Za-z][A-Za-z0-9]*)\s*}}/g)].map(
          (match) => match[1]!,
        ),
      ),
    );
    if ([...used].some((key) => !required.includes(key)))
      throw this.invalid('Unknown template placeholder');
    if (required.some((key) => variables[key] === undefined))
      throw this.invalid('Missing template placeholder');
    const subject = this.replace(template.subjectTemplate, variables, false)
      .replace(/[\r\n\0-\x1F\x7F]/g, ' ')
      .trim();
    if (!subject || subject.length > 200)
      throw this.invalid('Invalid email subject');
    const html = this.replace(template.htmlTemplate, variables, true);
    const text = this.replace(template.textTemplate, variables, false)
      .replace(/\r\n?/g, '\n')
      .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (!text.trim()) throw this.invalid('Plain-text email is required');
    return { subject, html, text };
  }
  private replace(
    source: string,
    values: Record<string, string>,
    html: boolean,
  ) {
    return source.replace(
      /{{\s*([A-Za-z][A-Za-z0-9]*)\s*}}/g,
      (_, key: string) => {
        const value = String(values[key] ?? '');
        return html
          ? value.replace(
              /[&<>"']/g,
              (character) =>
                ({
                  '&': '&amp;',
                  '<': '&lt;',
                  '>': '&gt;',
                  '"': '&quot;',
                  "'": '&#39;',
                })[character]!,
            )
          : value;
      },
    );
  }
  private invalid(message: string) {
    return new UnprocessableEntityException({
      code: 'EMAIL_TEMPLATE_INVALID',
      message,
    });
  }
}
