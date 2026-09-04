import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, inArray, lt, schema, sql } from '@joel-academy/database';
import { randomUUID } from 'node:crypto';
import type { Environment } from '../../../config/environment';
import { DatabaseService } from '../../../common/database/database.service';
import { MailService } from '../../../common/mail/mail.service';

interface ClaimedDelivery {
  id: string;
  recipientEmail: string;
  subject: string;
  text: string;
  html: string;
  attempt: number;
  maximumAttempts: number;
  userId: string | null;
}
@Injectable()
export class EmailWorkerService {
  private readonly workerId: string;
  constructor(
    private readonly database: DatabaseService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Environment, true>,
  ) {
    this.workerId =
      config.get('EMAIL_WORKER_ID', { infer: true }) || `email-${randomUUID()}`;
  }
  async tick() {
    if (!this.config.get('EMAIL_WORKER_ENABLED', { infer: true })) return 0;
    await this.recoverStale();
    const jobs = await this.claim();
    for (const job of jobs) await this.process(job);
    return jobs.length;
  }
  private async claim(): Promise<ClaimedDelivery[]> {
    const size = this.config.get('EMAIL_WORKER_BATCH_SIZE', { infer: true });
    const candidates = await this.database.client
      .select({ id: schema.emailDeliveries.id })
      .from(schema.emailDeliveries)
      .where(
        inArray(schema.emailDeliveries.status, ['QUEUED', 'RETRY_SCHEDULED']),
      )
      .limit(size);
    if (!candidates.length) return [];
    const ids = candidates.map((c: any) => c.id);
    const rows = await this.database.client
      .update(schema.emailDeliveries)
      .set({
        status: 'PROCESSING',
        lockedAt: new Date(),
        lockedBy: this.workerId,
        attemptCount: sql`${schema.emailDeliveries.attemptCount} + 1`,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(schema.emailDeliveries.id, ids))
      .returning({
        id: schema.emailDeliveries.id,
        recipientEmail: schema.emailDeliveries.recipientEmail,
        subject: schema.emailDeliveries.subjectSnapshot,
        text: schema.emailDeliveries.textBodySnapshot,
        html: schema.emailDeliveries.htmlBodySnapshot,
        attempt: schema.emailDeliveries.attemptCount,
        maximumAttempts: schema.emailDeliveries.maximumAttempts,
        userId: schema.emailDeliveries.userId,
      });
    return rows.map((row: any) => ({
      id: String(row.id),
      recipientEmail: String(row.recipientEmail),
      subject: String(row.subject ?? ''),
      text: String(row.text ?? ''),
      html: String(row.html ?? ''),
      attempt: Number(row.attempt),
      maximumAttempts: Number(row.maximumAttempts),
      userId: row.userId ? String(row.userId) : null,
    }));
  }
  private async process(delivery: ClaimedDelivery) {
    const db = this.database.client;
    const [attempt] = await db
      .insert(schema.emailDeliveryAttempts)
      .values({
        deliveryId: delivery.id,
        attemptNumber: delivery.attempt,
        workerId: this.workerId,
      })
      .returning();
    try {
      const result = await this.mail.sendMail({
        to: delivery.recipientEmail,
        subject: delivery.subject,
        text: delivery.text,
        html: delivery.html,
      });
      if (result.status === 'disabled') {
        await this.finishSuppressed(delivery, attempt!.id);
        return;
      }
      if (result.status !== 'sent') throw new Error('SMTP_TEMPORARY_FAILURE');
      await db.transaction(async (tx) => {
        await tx
          .update(schema.emailDeliveryAttempts)
          .set({
            status: 'SUCCEEDED',
            completedAt: new Date(),
            providerMessageId: result.messageId,
          })
          .where(eq(schema.emailDeliveryAttempts.id, attempt!.id));
        await tx
          .update(schema.emailDeliveries)
          .set({
            status: 'SENT',
            sentAt: new Date(),
            providerMessageId: result.messageId,
            lockedAt: null,
            lockedBy: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.emailDeliveries.id, delivery.id));
        if (delivery.userId) {
          try {
            await tx.insert(schema.notificationEvents).values({
              userId: delivery.userId,
              emailDeliveryId: delivery.id,
              eventType: 'email.sent',
              channel: 'EMAIL',
            });
          } catch {
            // Ignore event log if userId is not a valid user foreign key
          }
        }
      });
    } catch (error) {
      await this.fail(delivery, attempt!.id, error);
    }
  }
  private async finishSuppressed(delivery: ClaimedDelivery, attemptId: string) {
    await this.database.client.transaction(async (tx) => {
      await tx
        .update(schema.emailDeliveryAttempts)
        .set({
          status: 'PERMANENT_FAILURE',
          completedAt: new Date(),
          failureCode: 'MAIL_DISABLED',
          failureMessage: 'Email delivery is disabled',
        })
        .where(eq(schema.emailDeliveryAttempts.id, attemptId));
      await tx
        .update(schema.emailDeliveries)
        .set({
          status: 'SUPPRESSED',
          failureCode: 'MAIL_DISABLED',
          failureMessage: 'Email delivery is disabled',
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.emailDeliveries.id, delivery.id));
    });
  }
  private async fail(
    delivery: ClaimedDelivery,
    attemptId: string,
    error: unknown,
  ) {
    const permanent = /5\d\d|recipient|mailbox|invalid/i.test(String(error));
    const terminal = permanent || delivery.attempt >= delivery.maximumAttempts;
    const initial = this.config.get('EMAIL_INITIAL_RETRY_DELAY_SECONDS', {
      infer: true,
    });
    const maximum = this.config.get('EMAIL_MAX_RETRY_DELAY_SECONDS', {
      infer: true,
    });
    const delay = Math.min(
      maximum,
      initial * 2 ** Math.max(0, delivery.attempt - 1),
    );
    await this.database.client.transaction(async (tx) => {
      await tx
        .update(schema.emailDeliveryAttempts)
        .set({
          status: permanent ? 'PERMANENT_FAILURE' : 'TEMPORARY_FAILURE',
          completedAt: new Date(),
          failureCode: permanent
            ? 'SMTP_PERMANENT_FAILURE'
            : 'SMTP_TEMPORARY_FAILURE',
          failureMessage: 'Email provider rejected the delivery',
        })
        .where(eq(schema.emailDeliveryAttempts.id, attemptId));
      await tx
        .update(schema.emailDeliveries)
        .set({
          status: terminal ? 'FAILED' : 'RETRY_SCHEDULED',
          failedAt: terminal ? new Date() : null,
          nextAttemptAt: terminal ? null : new Date(Date.now() + delay * 1000),
          scheduledAt: terminal
            ? new Date()
            : new Date(Date.now() + delay * 1000),
          failureCode: permanent
            ? 'SMTP_PERMANENT_FAILURE'
            : 'SMTP_TEMPORARY_FAILURE',
          failureMessage: 'Email delivery failed',
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.emailDeliveries.id, delivery.id));
    });
  }
  private recoverStale() {
    const timeout = this.config.get('EMAIL_WORKER_LOCK_TIMEOUT_MS', {
      infer: true,
    });
    const cutoff = new Date(Date.now() - timeout);
    return this.database.client
      .update(schema.emailDeliveries)
      .set({
        status: 'RETRY_SCHEDULED',
        lockedAt: null,
        lockedBy: null,
        scheduledAt: new Date(),
        updatedAt: new Date(),
        failureCode: 'STALE_LOCK_RECOVERED',
        failureMessage: 'Stale worker lock recovered',
      })
      .where(
        and(
          eq(schema.emailDeliveries.status, 'PROCESSING'),
          lt(schema.emailDeliveries.lockedAt, cutoff),
        ),
      );
  }
}
