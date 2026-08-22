import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  ilike,
  isNull,
  or,
  schema,
  sql,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type {
  DeliveryListDto,
  NotificationListDto,
} from '../dto/notifications.dto';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly database: DatabaseService) {}
  get db() {
    return this.database.client;
  }

  listMine(userId: string, query: NotificationListDto) {
    return this.db
      .select({
        id: schema.notifications.id,
        type: schema.notifications.type,
        title: schema.notifications.title,
        message: schema.notifications.body,
        actionUrl: schema.notifications.actionUrl,
        priority: schema.notifications.priority,
        readAt: schema.notifications.readAt,
        createdAt: schema.notifications.createdAt,
      })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.channel, 'IN_APP'),
          isNull(schema.notifications.archivedAt),
          query.unread ? isNull(schema.notifications.readAt) : undefined,
          query.type ? eq(schema.notifications.type, query.type) : undefined,
          query.priority
            ? eq(schema.notifications.priority, query.priority)
            : undefined,
          query.search
            ? or(
                ilike(schema.notifications.title, `%${query.search}%`),
                ilike(schema.notifications.body, `%${query.search}%`),
              )
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.notifications.createdAt),
        desc(schema.notifications.id),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
  }
  mine(userId: string, id: string) {
    return this.db.query.notifications.findFirst({
      where: and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.archivedAt),
      ),
    });
  }
  async unread(userId: string) {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.channel, 'IN_APP'),
          isNull(schema.notifications.readAt),
          isNull(schema.notifications.archivedAt),
        ),
      );
    return Number(row?.count ?? 0);
  }
  async mark(userId: string, ids?: string[]) {
    const conditions = [
      eq(schema.notifications.userId, userId),
      isNull(schema.notifications.archivedAt),
      isNull(schema.notifications.readAt),
    ];
    if (ids)
      conditions.push(sql`${schema.notifications.id} = ANY(${ids}::uuid[])`);
    return this.db
      .update(schema.notifications)
      .set({ readAt: new Date(), updatedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: schema.notifications.id });
  }
  archive(userId: string, id: string) {
    return this.db
      .update(schema.notifications)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, userId),
        ),
      )
      .returning({ id: schema.notifications.id })
      .then((rows) => rows[0] ?? null);
  }
  createInApp(input: typeof schema.notifications.$inferInsert) {
    return this.db
      .insert(schema.notifications)
      .values(input)
      .onConflictDoNothing()
      .returning()
      .then((rows) => rows[0] ?? null);
  }
  activeTemplate(code: string, locale: string) {
    return this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.code, code),
        eq(schema.emailTemplates.locale, locale),
        eq(schema.emailTemplates.isActive, true),
        isNull(schema.emailTemplates.archivedAt),
      ),
    });
  }
  createDelivery(input: typeof schema.emailDeliveries.$inferInsert) {
    return this.db.transaction(async (tx) => {
      const [delivery] = await tx
        .insert(schema.emailDeliveries)
        .values(input)
        .onConflictDoNothing()
        .returning();
      if (delivery && delivery.userId)
        await tx.insert(schema.notificationEvents).values({
          userId: delivery.userId,
          emailDeliveryId: delivery.id,
          eventType: 'email.queued',
          channel: 'EMAIL',
          relatedEntityType: delivery.relatedEntityType,
          relatedEntityId: delivery.relatedEntityId,
        });
      return delivery ?? null;
    });
  }
  listDeliveries(query: DeliveryListDto) {
    return this.db
      .select({
        id: schema.emailDeliveries.id,
        recipientEmail: schema.emailDeliveries.recipientEmail,
        templateCode: schema.emailDeliveries.templateCode,
        templateVersion: schema.emailDeliveries.templateVersion,
        status: schema.emailDeliveries.status,
        priority: schema.emailDeliveries.priority,
        scheduledAt: schema.emailDeliveries.scheduledAt,
        sentAt: schema.emailDeliveries.sentAt,
        attemptCount: schema.emailDeliveries.attemptCount,
        failureCode: schema.emailDeliveries.failureCode,
        failureMessage: schema.emailDeliveries.failureMessage,
        createdAt: schema.emailDeliveries.createdAt,
      })
      .from(schema.emailDeliveries)
      .where(
        and(
          query.status
            ? eq(schema.emailDeliveries.status, query.status)
            : undefined,
          query.templateCode
            ? eq(schema.emailDeliveries.templateCode, query.templateCode)
            : undefined,
          query.search
            ? sql`${schema.emailDeliveries.recipientEmail} ILIKE ${`%${query.search.toLowerCase()}%`}`
            : undefined,
          query.from
            ? sql`${schema.emailDeliveries.createdAt} >= ${new Date(query.from)}`
            : undefined,
          query.to
            ? sql`${schema.emailDeliveries.createdAt} <= ${new Date(query.to)}`
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.emailDeliveries.createdAt),
        desc(schema.emailDeliveries.id),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
  }
  delivery(id: string) {
    return this.db.query.emailDeliveries.findFirst({
      where: eq(schema.emailDeliveries.id, id),
    });
  }
  attempts(id: string) {
    return this.db
      .select()
      .from(schema.emailDeliveryAttempts)
      .where(eq(schema.emailDeliveryAttempts.deliveryId, id))
      .orderBy(desc(schema.emailDeliveryAttempts.attemptNumber));
  }
  templates() {
    return this.db
      .select({
        id: schema.emailTemplates.id,
        code: schema.emailTemplates.code,
        name: schema.emailTemplates.name,
        version: schema.emailTemplates.version,
        locale: schema.emailTemplates.locale,
        isActive: schema.emailTemplates.isActive,
        description: schema.emailTemplates.description,
        updatedAt: schema.emailTemplates.updatedAt,
      })
      .from(schema.emailTemplates)
      .orderBy(schema.emailTemplates.code, desc(schema.emailTemplates.version));
  }
  template(id: string) {
    return this.db.query.emailTemplates.findFirst({
      where: eq(schema.emailTemplates.id, id),
    });
  }
  retry(actorId: string, id: string, reason: string) {
    return this.transition(actorId, id, 'retry', reason);
  }
  cancel(actorId: string, id: string, reason: string) {
    return this.transition(actorId, id, 'cancel', reason);
  }
  private transition(
    actorId: string,
    id: string,
    operation: 'retry' | 'cancel',
    reason: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM email_deliveries WHERE id = ${id} FOR UPDATE`,
      );
      const delivery = await tx.query.emailDeliveries.findFirst({
        where: eq(schema.emailDeliveries.id, id),
      });
      if (!delivery) throw new Error('DELIVERY_NOT_FOUND');
      const allowed =
        operation === 'retry'
          ? delivery.status === 'FAILED'
          : ['QUEUED', 'RETRY_SCHEDULED'].includes(delivery.status);
      if (!allowed) throw new Error('DELIVERY_TRANSITION_NOT_ALLOWED');
      const status =
        operation === 'retry' ? ('QUEUED' as const) : ('CANCELLED' as const);
      const [updated] = await tx
        .update(schema.emailDeliveries)
        .set({
          status,
          scheduledAt: new Date(),
          cancelledAt: operation === 'cancel' ? new Date() : null,
          failureCode: null,
          failureMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.emailDeliveries.id, id))
        .returning();
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: `email_delivery.${operation}`,
        entityType: 'email_delivery',
        entityId: id,
        before: { status: delivery.status },
        after: { status, reason },
      });
      return updated;
    });
  }
  async health(lockTimeoutMs: number) {
    const [row] = await this.db
      .select({
        pending: sql<number>`count(*) filter (where status = 'QUEUED')`,
        retrying: sql<number>`count(*) filter (where status = 'RETRY_SCHEDULED')`,
        processing: sql<number>`count(*) filter (where status = 'PROCESSING')`,
        failed: sql<number>`count(*) filter (where status = 'FAILED')`,
        stale: sql<number>`count(*) filter (where status = 'PROCESSING' and locked_at < now() - (${lockTimeoutMs} * interval '1 millisecond'))`,
        oldest: sql<Date | null>`min(scheduled_at) filter (where status in ('QUEUED','RETRY_SCHEDULED'))`,
      })
      .from(schema.emailDeliveries);
    return row;
  }

  async createSmsDelivery(data: {
    userId: string;
    recipientPhone: string;
    messageText: string;
    templateCode: string;
    status: 'QUEUED' | 'SUPPRESSED';
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    deduplicationKey?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const [row] = await this.db
      .insert(schema.smsDeliveries)
      .values({
        userId: data.userId,
        recipientPhone: data.recipientPhone,
        messageText: data.messageText,
        templateCode: data.templateCode,
        status: data.status,
        priority: data.priority ?? 'NORMAL',
        deduplicationKey: data.deduplicationKey,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        attemptCount: 0,
        maximumAttempts: 3,
      })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  }

  async claimSmsDelivery(workerId: string) {
    const result = await this.db.execute(
      sql`WITH candidate AS (
        SELECT id FROM sms_deliveries
        WHERE status IN ('QUEUED', 'RETRY_SCHEDULED')
          AND scheduled_at <= now()
        ORDER BY priority DESC, scheduled_at ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE sms_deliveries s
      SET status = 'PROCESSING',
          attempt_count = attempt_count + 1,
          last_attempt_at = now(),
          locked_at = now(),
          locked_by = ${workerId},
          updated_at = now()
      FROM candidate
      WHERE s.id = candidate.id
      RETURNING s.*`,
    );
    return (result as any).rows?.[0] ?? (result as any)[0] ?? null;
  }

  async markSmsDeliverySuccess(
    id: string,
    providerMessageId?: string,
    providerLogId?: string,
  ) {
    return this.db
      .update(schema.smsDeliveries)
      .set({
        status: 'SUCCEEDED',
        sentAt: new Date(),
        providerMessageId: providerMessageId ?? null,
        providerLogId: providerLogId ?? null,
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.smsDeliveries.id, id));
  }

  async markSmsDeliveryFailure(
    id: string,
    failureCode: string,
    failureMessage: string,
    maxAttempts = 3,
  ) {
    const [delivery] = await this.db
      .select({ attemptCount: schema.smsDeliveries.attemptCount })
      .from(schema.smsDeliveries)
      .where(eq(schema.smsDeliveries.id, id));
    const attempts = delivery?.attemptCount ?? 1;
    const isFinal = attempts >= maxAttempts;
    const nextAttempt = isFinal
      ? null
      : new Date(Date.now() + Math.pow(2, attempts) * 60_000);

    return this.db
      .update(schema.smsDeliveries)
      .set({
        status: isFinal ? 'FAILED' : 'RETRY_SCHEDULED',
        failedAt: isFinal ? new Date() : null,
        failureCode,
        failureMessage,
        nextAttemptAt: nextAttempt,
        scheduledAt: nextAttempt ?? new Date(),
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.smsDeliveries.id, id));
  }
}
