/**
 * On-brand HTML/text content for every system email template code.
 *
 * Colors are the light-theme values from `apps/web/src/app/globals.css`
 * converted from HSL to hex - email clients don't reliably support CSS
 * custom properties or `hsl()` in all contexts, so these are hardcoded
 * rather than referencing the token names directly. Keep in sync by eye
 * if the design tokens change materially.
 *
 * Every `{{placeholder}}` used here MUST be a member of that code's entry
 * in `TEMPLATE_PLACEHOLDERS` (`apps/api/src/modules/notifications/services/email-rendering.service.ts`) -
 * `EmailRenderingService.render()` rejects any template that references a
 * placeholder outside its code's allow-list.
 */

const COLOR = {
  bg: '#F8F9FC',
  card: '#FFFFFF',
  navy: '#0A1743',
  green: '#69BD28',
  greenDark: '#569C21',
  text: '#1A1D1F',
  muted: '#6C7689',
  border: '#DEE4ED',
  destructive: '#F04438',
} as const;

function shellHtml(bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>{{academyName}}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLOR.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLOR.card};border-radius:20px;overflow:hidden;box-shadow:0 12px 24px -8px rgba(10,23,67,0.12);">
            <tr>
              <td style="background-color:${COLOR.navy};padding:26px 32px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:999px;background-color:${COLOR.green};vertical-align:middle;margin-right:10px;"></span>
                <span style="color:#FFFFFF;font-size:18px;font-weight:700;letter-spacing:-0.01em;vertical-align:middle;">{{academyName}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <hr style="border:none;border-top:1px solid ${COLOR.border};margin:0 0 20px 0;" />
                <p style="margin:0;color:${COLOR.muted};font-size:12px;line-height:18px;">
                  You are receiving this email because you have an account at {{academyName}}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function shellText(bodyText: string): string {
  return `{{academyName}}\n\n${bodyText}\n\n---\nYou are receiving this email because you have an account at {{academyName}}.`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 12px 0;color:${COLOR.text};font-size:22px;font-weight:700;letter-spacing:-0.01em;line-height:28px;">${text}</h1>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px 0;color:${COLOR.text};font-size:15px;line-height:24px;">${html}</p>`;
}

function muted(html: string): string {
  return `<p style="margin:16px 0 0 0;color:${COLOR.muted};font-size:13px;line-height:20px;">${html}</p>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:999px;background-color:${COLOR.greenDark};background-image:linear-gradient(135deg,${COLOR.green},${COLOR.greenDark});">
                      <a href="${url}" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">${label}</a>
                    </td>
                  </tr>
                </table>`;
}

function noticeBox(html: string, accent: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px 0;">
                  <tr>
                    <td style="background-color:${accent}1A;border-left:3px solid ${accent};border-radius:8px;padding:12px 16px;color:${COLOR.text};font-size:14px;line-height:21px;">${html}</td>
                  </tr>
                </table>`;
}

function supportLine(): string {
  return `Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color:${COLOR.green};text-decoration:none;font-weight:600;">{{supportEmail}}</a>.`;
}

export interface EmailTemplateContent {
  subject: string;
  html: string;
  text: string;
}

export type EmailTemplateCode =
  | 'EMAIL_VERIFICATION'
  | 'WELCOME'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'NEW_LOGIN_ALERT'
  | 'GOOGLE_ACCOUNT_LINKED'
  | 'GOOGLE_ACCOUNT_UNLINKED'
  | 'GOOGLE_SIGN_IN'
  | 'ACCOUNT_ACTIVATED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_ARCHIVED'
  | 'ACCOUNT_RESTORED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REMOVED'
  | 'SESSION_REVOKED_BY_ADMIN'
  | 'FREE_ENROLLMENT_CONFIRMED'
  | 'PAID_ENROLLMENT_CREATED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_DECLINED'
  | 'COURSE_COMPLETED'
  | 'CERTIFICATE_READY'
  | 'CERTIFICATE_REVOKED';

/** Exhaustively typed against `EmailTemplateCode` - a missing or extra code fails the build. */
export const EMAIL_TEMPLATE_CONTENT: Record<EmailTemplateCode, EmailTemplateContent> = {
  EMAIL_VERIFICATION: {
    subject: 'Verify your email to get started',
    html: shellHtml(
      heading('Confirm your email address') +
        paragraph(
          'Hi {{recipientName}}, welcome to {{academyName}}! Please confirm this is your email address to activate your account.',
        ) +
        button('Verify Email Address', '{{verificationUrl}}') +
        muted(
          'This link expires in {{expiresInMinutes}} minutes. If you did not create this account, you can safely ignore this email. ' +
            supportLine(),
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nWelcome to {{academyName}}! Confirm your email address using the link below:\n{{verificationUrl}}\n\nThis link expires in {{expiresInMinutes}} minutes.\nIf you did not create this account, you can ignore this email.\nNeed help? {{supportEmail}}',
    ),
  },
  WELCOME: {
    subject: 'Welcome to Joel Talargie Academy!',
    html: shellHtml(
      heading('Welcome to {{academyName}}!') +
        paragraph(
          'Hi {{recipientName}}, your account is ready. Start exploring courses and begin learning today.',
        ) +
        button('Start Learning', '{{dashboardUrl}}') +
        muted(supportLine()),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nWelcome to {{academyName}}! Your account is ready. Start exploring courses and begin learning today:\n{{dashboardUrl}}\n\nNeed help? {{supportEmail}}',
    ),
  },
  PASSWORD_RESET: {
    subject: 'Reset your password',
    html: shellHtml(
      heading('Reset your password') +
        paragraph('Hi {{recipientName}}, we received a request to reset your password.') +
        button('Reset Password', '{{resetUrl}}') +
        muted(
          'This link expires in {{expiresInMinutes}} minutes. If you did not request this, no action is needed - your password will stay the same. ' +
            supportLine(),
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nWe received a request to reset your password:\n{{resetUrl}}\n\nThis link expires in {{expiresInMinutes}} minutes.\nIf you did not request this, no action is needed.\nNeed help? {{supportEmail}}',
    ),
  },
  PASSWORD_CHANGED: {
    subject: 'Your password was changed',
    html: shellHtml(
      heading('Your password was changed') +
        paragraph(
          'Hi {{recipientName}}, this confirms your {{academyName}} password was just changed.',
        ) +
        noticeBox('If you made this change, no further action is needed.', COLOR.green) +
        muted(
          "If you didn't do this, your account may be compromised - please reset your password immediately and " +
            supportLine(),
        ),
    ),
    text: shellText(
      "Hi {{recipientName}},\n\nThis confirms your {{academyName}} password was just changed.\nIf this wasn't you, reset your password immediately.\nNeed help? {{supportEmail}}",
    ),
  },
  NEW_LOGIN_ALERT: {
    subject: 'New sign-in to your account',
    html: shellHtml(
      heading('New sign-in detected') +
        paragraph(
          'Hi {{recipientName}}, we noticed a new sign-in to your {{academyName}} account.',
        ) +
        noticeBox('If this was you, you can safely ignore this message.', COLOR.green) +
        muted(
          "If you don't recognize this activity, please secure your account and " + supportLine(),
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nWe noticed a new sign-in to your {{academyName}} account.\nIf this was you, no action is needed.\nIf not, please secure your account.\nNeed help? {{supportEmail}}',
    ),
  },
  GOOGLE_ACCOUNT_LINKED: {
    subject: 'Google account linked',
    html: shellHtml(
      heading('Google account linked') +
        paragraph(
          'Hi {{recipientName}}, your Google account has been linked to your {{academyName}} account. You can now sign in with Google.',
        ) +
        muted("If you didn't do this, please " + supportLine()),
    ),
    text: shellText(
      "Hi {{recipientName}},\n\nYour Google account has been linked to your {{academyName}} account.\nIf this wasn't you, please contact us at {{supportEmail}}.",
    ),
  },
  GOOGLE_ACCOUNT_UNLINKED: {
    subject: 'Google account unlinked',
    html: shellHtml(
      heading('Google account unlinked') +
        paragraph(
          'Hi {{recipientName}}, your Google account has been unlinked from your {{academyName}} account.',
        ) +
        muted("If you didn't do this, please " + supportLine()),
    ),
    text: shellText(
      "Hi {{recipientName}},\n\nYour Google account has been unlinked from your {{academyName}} account.\nIf this wasn't you, please contact us at {{supportEmail}}.",
    ),
  },
  GOOGLE_SIGN_IN: {
    subject: 'New sign-in to your account with Google',
    html: shellHtml(
      heading('New Google sign-in detected') +
        paragraph(
          'Hi {{recipientName}}, we noticed a new sign-in to your {{academyName}} account using your Google account.',
        ) +
        noticeBox('If this was you, you can safely ignore this message.', COLOR.green) +
        muted(
          "If you don't recognize this activity, please secure your account and " + supportLine(),
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nWe noticed a new sign-in to your {{academyName}} account using your Google account.\nIf this was you, no action is needed.\nIf not, please secure your account.\nNeed help? {{supportEmail}}',
    ),
  },
  ACCOUNT_ACTIVATED: {
    subject: 'Your account is active',
    html: shellHtml(
      heading('Your account is active') +
        paragraph(
          'Hi {{recipientName}}, great news - your {{academyName}} account has been activated. You now have full access.',
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour {{academyName}} account has been activated. You now have full access.',
    ),
  },
  ACCOUNT_SUSPENDED: {
    subject: 'Your account has been suspended',
    html: shellHtml(
      heading('Your account has been suspended') +
        paragraph('Hi {{recipientName}}, your {{academyName}} account has been suspended.') +
        noticeBox('Access to your account is temporarily restricted.', COLOR.destructive) +
        muted('If you believe this is a mistake, ' + supportLine()),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour {{academyName}} account has been suspended. Access is temporarily restricted.\nIf you believe this is a mistake, contact us at {{supportEmail}}.',
    ),
  },
  ACCOUNT_ARCHIVED: {
    subject: 'Your account has been archived',
    html: shellHtml(
      heading('Your account has been archived') +
        paragraph(
          'Hi {{recipientName}}, your {{academyName}} account has been archived and is no longer active.',
        ) +
        muted('If you believe this is a mistake, ' + supportLine()),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour {{academyName}} account has been archived and is no longer active.\nIf you believe this is a mistake, contact us at {{supportEmail}}.',
    ),
  },
  ACCOUNT_RESTORED: {
    subject: 'Your account has been restored',
    html: shellHtml(
      heading('Welcome back!') +
        paragraph(
          'Hi {{recipientName}}, your {{academyName}} account has been restored and is active again.',
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour {{academyName}} account has been restored and is active again.',
    ),
  },
  ROLE_ASSIGNED: {
    subject: "You've been assigned a new role",
    html: shellHtml(
      heading('New role assigned') +
        paragraph(
          'Hi {{recipientName}}, you have been assigned the <strong>{{roleName}}</strong> role at {{academyName}}.',
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYou have been assigned the {{roleName}} role at {{academyName}}.',
    ),
  },
  ROLE_REMOVED: {
    subject: 'A role has been removed from your account',
    html: shellHtml(
      heading('Role removed') +
        paragraph(
          'Hi {{recipientName}}, the <strong>{{roleName}}</strong> role has been removed from your {{academyName}} account.',
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nThe {{roleName}} role has been removed from your {{academyName}} account.',
    ),
  },
  SESSION_REVOKED_BY_ADMIN: {
    subject: 'One of your sessions was signed out',
    html: shellHtml(
      heading('Session signed out') +
        paragraph(
          'Hi {{recipientName}}, an administrator signed one of your active sessions out of {{academyName}}.',
        ) +
        muted("If you don't recognize this, " + supportLine()),
    ),
    text: shellText(
      "Hi {{recipientName}},\n\nAn administrator signed one of your active sessions out of {{academyName}}.\nIf you don't recognize this, contact us at {{supportEmail}}.",
    ),
  },
  FREE_ENROLLMENT_CONFIRMED: {
    subject: "You're enrolled in {{courseTitle}}",
    html: shellHtml(
      heading("You're enrolled!") +
        paragraph(
          'Hi {{recipientName}}, you are now enrolled in <strong>{{courseTitle}}</strong>. Jump in whenever you are ready.',
        ) +
        button('Go to Dashboard', '{{dashboardUrl}}'),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYou are now enrolled in {{courseTitle}}. Jump in whenever you are ready:\n{{dashboardUrl}}',
    ),
  },
  PAID_ENROLLMENT_CREATED: {
    subject: 'Complete your enrollment payment',
    html: shellHtml(
      heading('One more step') +
        paragraph(
          'Hi {{recipientName}}, you are almost enrolled in <strong>{{courseTitle}}</strong>. Submit your payment to complete enrollment.',
        ) +
        button('Complete Payment', '{{paymentUrl}}'),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYou are almost enrolled in {{courseTitle}}. Submit your payment to complete enrollment:\n{{paymentUrl}}',
    ),
  },
  PAYMENT_SUBMITTED: {
    subject: 'Payment received - under review',
    html: shellHtml(
      heading('Payment received') +
        paragraph(
          'Hi {{recipientName}}, we received your payment for <strong>{{courseTitle}}</strong> and it is now under review.',
        ) +
        button('View Dashboard', '{{dashboardUrl}}'),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nWe received your payment for {{courseTitle}} and it is now under review:\n{{dashboardUrl}}',
    ),
  },
  PAYMENT_APPROVED: {
    subject: "Payment approved - you're enrolled!",
    html: shellHtml(
      heading('Payment approved') +
        paragraph(
          'Hi {{recipientName}}, your payment for <strong>{{courseTitle}}</strong> was approved on {{approvedAt}}. You are all set!',
        ) +
        button('Start Learning', '{{dashboardUrl}}'),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour payment for {{courseTitle}} was approved on {{approvedAt}}. You are all set!\n{{dashboardUrl}}',
    ),
  },
  PAYMENT_DECLINED: {
    subject: 'Action needed: payment declined',
    html: shellHtml(
      heading('Payment declined') +
        paragraph(
          'Hi {{recipientName}}, your payment for <strong>{{courseTitle}}</strong> could not be approved.',
        ) +
        noticeBox('Reason: {{declineReason}}', COLOR.destructive) +
        button('Resubmit Payment', '{{paymentUrl}}'),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour payment for {{courseTitle}} could not be approved.\nReason: {{declineReason}}\n\nResubmit your payment:\n{{paymentUrl}}',
    ),
  },
  COURSE_COMPLETED: {
    subject: 'Congratulations - you completed {{courseTitle}}!',
    html: shellHtml(
      heading('You did it!') +
        paragraph(
          'Hi {{recipientName}}, congratulations on completing <strong>{{courseTitle}}</strong>! Great work.',
        ) +
        button('View Dashboard', '{{dashboardUrl}}'),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nCongratulations on completing {{courseTitle}}! Great work.\n{{dashboardUrl}}',
    ),
  },
  CERTIFICATE_READY: {
    subject: 'Your certificate is ready',
    html: shellHtml(
      heading('Your certificate is ready') +
        paragraph(
          'Hi {{recipientName}}, your certificate for <strong>{{courseTitle}}</strong> has been generated.',
        ) +
        button('Download Certificate', '{{certificateUrl}}') +
        muted(
          `Certificate number <strong style="color:${COLOR.text};">{{certificateNumber}}</strong>. Anyone can verify its authenticity at <a href="{{verificationUrl}}" style="color:${COLOR.green};text-decoration:none;font-weight:600;">{{verificationUrl}}</a>.`,
        ),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour certificate for {{courseTitle}} has been generated:\n{{certificateUrl}}\n\nCertificate number: {{certificateNumber}}\nVerify at: {{verificationUrl}}',
    ),
  },
  CERTIFICATE_REVOKED: {
    subject: 'Certificate revoked notice',
    html: shellHtml(
      heading('Certificate revoked') +
        paragraph(
          'Hi {{recipientName}}, your certificate for <strong>{{courseTitle}}</strong> (number {{certificateNumber}}) has been revoked and is no longer valid.',
        ) +
        muted('If you believe this is a mistake, ' + supportLine()),
    ),
    text: shellText(
      'Hi {{recipientName}},\n\nYour certificate for {{courseTitle}} (number {{certificateNumber}}) has been revoked and is no longer valid.\nIf you believe this is a mistake, contact us at {{supportEmail}}.',
    ),
  },
};
