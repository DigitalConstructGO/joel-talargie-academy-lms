import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
/* eslint-disable no-control-regex */
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../config/environment';
import type {
  DeliveryListDto,
  NotificationListDto,
} from '../dto/notifications.dto';
import { NotificationsRepository } from '../repositories/notifications.repository';
import {
  EmailRenderingService,
  TEMPLATE_PLACEHOLDERS,
} from './email-rendering.service';

const ESSENTIAL = new Set([
  'PASSWORD_CHANGED',
  'NEW_LOGIN_ALERT',
  'ACCOUNT_SUSPENDED',
  'ROLE_ASSIGNED',
  'ROLE_REMOVED',
  'SESSION_REVOKED_BY_ADMIN',
  'CERTIFICATE_REVOKED',
]);
const INTERNAL_PATH = /^\/(?:dashboard|auth)(?:\/[-A-Za-z0-9_]+)*\/?$/;
export interface NotificationRequest {
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  templateCode: string;
  variables: Record<string, string>;
  deduplicationKey: string;
  category: 'security' | 'learning' | 'payments' | 'certificates';
  title: string;
  message: string;
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly renderer: EmailRenderingService,
    private readonly config: ConfigService<Environment, true>,
  ) {}
  listMine(userId: string, query: NotificationListDto) {
    return this.repository.listMine(userId, query);
  }
  async mine(userId: string, id: string) {
    const row = await this.repository.mine(userId, id);
    if (!row) throw this.notFound();
    return row;
  }
  async unread(userId: string) {
    return { unreadCount: await this.repository.unread(userId) };
  }
  mark(userId: string, ids?: string[]) {
    return this.repository
      .mark(userId, ids)
      .then((rows) => ({ updated: rows.length }));
  }
  async archive(userId: string, id: string) {
    if (!(await this.repository.archive(userId, id))) throw this.notFound();
    return { archived: true };
  }

  async notify(input: NotificationRequest) {
    this.validateAction(input.actionUrl);
    const essential = ESSENTIAL.has(input.templateCode);
    const preferences =
      await this.repository.db.query.userNotificationPreferences.findFirst({
        where: (table, { eq }) => eq(table.userId, input.userId),
      });
    const suffix = input.category[0]!.toUpperCase() + input.category.slice(1);
    const emailEnabled =
      essential ||
      preferences?.[`email${suffix}` as keyof typeof preferences] !== false;
    const inAppEnabled =
      essential ||
      input.category === 'security' ||
      preferences?.[`inApp${suffix}` as keyof typeof preferences] !== false;
    if (inAppEnabled)
      await this.repository.createInApp({
        userId: input.userId,
        channel: 'IN_APP',
        status: 'SENT',
        type: input.templateCode,
        title: this.clean(input.title, 200),
        body: this.clean(input.message, 2000),
        actionUrl: input.actionUrl,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        priority: input.priority ?? 'NORMAL',
        deduplicationKey: `in-app:${input.deduplicationKey}`,
      });
    const template = await this.repository.activeTemplate(
      input.templateCode,
      this.config.get('EMAIL_DEFAULT_LOCALE', { infer: true }),
    );
    if (!template)
      throw new UnprocessableEntityException({
        code: 'EMAIL_TEMPLATE_UNAVAILABLE',
        message: 'Required email template is unavailable',
      });
    const rendered = this.renderer.render(template, input.variables);
    return this.repository.createDelivery({
      userId: input.userId,
      recipientEmail: this.email(input.recipientEmail),
      recipientName: input.recipientName
        ? this.clean(input.recipientName, 200)
        : null,
      templateCode: template.code,
      templateVersion: template.version,
      locale: template.locale,
      subjectSnapshot: rendered.subject,
      textBodySnapshot: rendered.text,
      htmlBodySnapshot: rendered.html,
      status: emailEnabled ? 'QUEUED' : 'SUPPRESSED',
      priority: input.priority ?? 'NORMAL',
      deduplicationKey: `email:${input.deduplicationKey}`,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      maximumAttempts: this.config.get('EMAIL_MAX_RETRY_ATTEMPTS', {
        infer: true,
      }),
    });
  }

  listDeliveries(query: DeliveryListDto) {
    return this.repository.listDeliveries(query).then((rows) =>
      rows.map((row) => ({
        ...row,
        recipientEmail: this.mask(row.recipientEmail),
      })),
    );
  }
  async delivery(id: string, sensitive = false) {
    const row = await this.repository.delivery(id);
    if (!row) throw this.notFound('EMAIL_DELIVERY_NOT_FOUND');
    const { htmlBodySnapshot, textBodySnapshot, ...safe } = row;
    return {
      ...safe,
      recipientEmail: this.mask(row.recipientEmail),
      ...(sensitive
        ? {
            htmlBodyPreview: this.redact(htmlBodySnapshot),
            textBodyPreview: this.redact(textBodySnapshot),
          }
        : {}),
    };
  }
  attempts(id: string) {
    return this.repository.attempts(id).then((rows) =>
      rows.map(({ workerId, ...row }) => ({
        ...row,
        worker: workerId ? 'assigned' : null,
      })),
    );
  }
  templates() {
    return this.repository.templates();
  }
  async template(id: string) {
    const row = await this.repository.template(id);
    if (!row) throw this.notFound('EMAIL_TEMPLATE_NOT_FOUND');
    const { htmlTemplate, textTemplate, ...safe } = row;
    return {
      ...safe,
      placeholders: TEMPLATE_PLACEHOLDERS[row.code] ?? [],
      hasHtml: Boolean(htmlTemplate),
      hasText: Boolean(textTemplate),
    };
  }
  async preview(id: string, variables: Record<string, string>) {
    const template = await this.repository.template(id);
    if (!template) throw this.notFound('EMAIL_TEMPLATE_NOT_FOUND');
    return this.renderer.render(template, variables);
  }
  async retry(actorId: string, id: string, reason: string) {
    try {
      return await this.repository.retry(actorId, id, reason.trim());
    } catch (error) {
      this.map(error);
    }
  }
  async cancel(actorId: string, id: string, reason: string) {
    try {
      return await this.repository.cancel(actorId, id, reason.trim());
    } catch (error) {
      this.map(error);
    }
  }
  async health() {
    const data = await this.repository.health(
      this.config.get('EMAIL_WORKER_LOCK_TIMEOUT_MS', { infer: true }),
    );
    return {
      workerEnabled: this.config.get('EMAIL_WORKER_ENABLED', { infer: true }),
      mailEnabled: this.config.get('MAIL_ENABLED', { infer: true }),
      pending: Number(data?.pending ?? 0),
      retryScheduled: Number(data?.retrying ?? 0),
      processing: Number(data?.processing ?? 0),
      failed: Number(data?.failed ?? 0),
      staleLocks: Number(data?.stale ?? 0),
      oldestQueuedAt: data?.oldest ?? null,
      templates: (await this.repository.templates()).filter(
        (row) => row.isActive,
      ).length,
    };
  }
  private email(value: string) {
    const email = value.trim().toLowerCase();
    if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email) || /[\r\n]/.test(email))
      throw new UnprocessableEntityException({
        code: 'RECIPIENT_INVALID',
        message: 'Recipient email is invalid',
      });
    return email;
  }
  private validateAction(value?: string) {
    if (value && !INTERNAL_PATH.test(value))
      throw new UnprocessableEntityException({
        code: 'ACTION_URL_INVALID',
        message: 'Action URL must be an approved internal path',
      });
  }
  private clean(value: string, max: number) {
    return value
      .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, max);
  }
  private mask(value: string) {
    const [local, domain] = value.split('@');
    return `${local?.slice(0, 2) ?? '**'}***@${domain ?? 'hidden'}`;
  }
  private redact(value: string) {
    return value
      .replace(
        /https?:\/\/[^\s<]+(?:token|verify|reset)[^\s<]*/gi,
        '[REDACTED_SECURITY_URL]',
      )
      .slice(0, 2000);
  }
  private notFound(code = 'NOTIFICATION_NOT_FOUND') {
    return new NotFoundException({ code, message: 'Resource not found' });
  }
  private map(error: unknown): never {
    const value = String(error);
    if (value.includes('NOT_FOUND'))
      throw this.notFound('EMAIL_DELIVERY_NOT_FOUND');
    if (value.includes('NOT_ALLOWED'))
      throw new ConflictException({
        code: 'EMAIL_DELIVERY_STATUS_INVALID',
        message: 'Delivery operation is not allowed',
      });
    throw error;
  }
}
