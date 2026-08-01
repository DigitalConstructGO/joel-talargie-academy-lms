import type { SentMessageInfo, Transporter } from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';

export interface SendMailOptions {
  to: string | readonly string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: readonly Attachment[];
}

export type MailSendResult =
  | { status: 'sent'; messageId?: string }
  | { status: 'disabled' }
  | { status: 'failed'; error: 'Email delivery failed' };

export type MailConnectionStatus =
  | { status: 'available' }
  | { status: 'disabled' }
  | { status: 'unavailable'; error: 'Email connection unavailable' };

export type MailTransporter = Transporter<SentMessageInfo>;
