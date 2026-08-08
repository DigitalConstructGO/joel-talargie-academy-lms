import type {
  SendMailOptions,
  MailSendResult,
} from '../../common/mail/mail.types';
export interface TemplateMailOptions {
  template: string;
  to: string;
  variables: Record<string, string>;
}
export interface MailGateway {
  send(options: SendMailOptions): Promise<MailSendResult>;
  sendTemplate(options: TemplateMailOptions): Promise<MailSendResult>;
  queue(options: SendMailOptions | TemplateMailOptions): Promise<string>;
}
