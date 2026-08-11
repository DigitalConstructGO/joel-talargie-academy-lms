import { and, asc, desc, eq, lt, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { backgroundJobs, courses, notifications, payments, schema } from './schema/index.ts';

export const MAX_PAGE_SIZE = 100;
const pageSize = (requested: number) => Math.max(1, Math.min(MAX_PAGE_SIZE, Math.trunc(requested)));
export type AcademyDatabase = NodePgDatabase<typeof schema>;

export interface DateCursor {
  date: Date;
  id: string;
}

export function publicCourseCatalogQuery(
  database: AcademyDatabase,
  requestedSize: number,
  cursor?: DateCursor,
  search?: string,
) {
  const cursorFilter = cursor
    ? or(
        lt(courses.publishedAt, cursor.date),
        and(eq(courses.publishedAt, cursor.date), lt(courses.id, cursor.id)),
      )
    : undefined;
  const searchFilter = search?.trim()
    ? sql`${courses.searchVector} @@ websearch_to_tsquery('simple', ${search.trim()})`
    : undefined;
  return database
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      shortDescription: courses.shortDescription,
      presenterName: courses.presenterName,
      publishedAt: courses.publishedAt,
    })
    .from(courses)
    .where(
      and(
        eq(courses.status, 'PUBLISHED'),
        eq(courses.visibility, 'PUBLIC'),
        sql`${courses.archivedAt} IS NULL`,
        cursorFilter,
        searchFilter,
      ),
    )
    .orderBy(desc(courses.publishedAt), desc(courses.id))
    .limit(pageSize(requestedSize));
}

export function pendingPaymentsQuery(
  database: AcademyDatabase,
  requestedSize: number,
  cursor?: DateCursor,
) {
  return database
    .select({
      id: payments.id,
      enrollmentId: payments.enrollmentId,
      transactionId: payments.transactionId,
      amount: payments.amount,
      currency: payments.currency,
      submittedAt: payments.submittedAt,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'PENDING'),
        cursor
          ? or(
              sql`${payments.submittedAt} > ${cursor.date}`,
              and(eq(payments.submittedAt, cursor.date), sql`${payments.id} > ${cursor.id}`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(payments.submittedAt), asc(payments.id))
    .limit(pageSize(requestedSize));
}

export function unreadNotificationsQuery(
  database: AcademyDatabase,
  userId: string,
  requestedSize: number,
  cursor?: DateCursor,
) {
  return database
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.channel, 'IN_APP'),
        sql`${notifications.readAt} IS NULL`,
        cursor
          ? or(
              lt(notifications.createdAt, cursor.date),
              and(eq(notifications.createdAt, cursor.date), lt(notifications.id, cursor.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(pageSize(requestedSize));
}

export function claimBackgroundJobsQuery(database: AcademyDatabase, requestedSize: number) {
  return database
    .select({
      id: backgroundJobs.id,
      jobType: backgroundJobs.jobType,
      payload: backgroundJobs.payload,
      attempts: backgroundJobs.attempts,
    })
    .from(backgroundJobs)
    .where(and(eq(backgroundJobs.status, 'PENDING'), sql`${backgroundJobs.scheduledAt} <= now()`))
    .orderBy(asc(backgroundJobs.scheduledAt), asc(backgroundJobs.priority), asc(backgroundJobs.id))
    .limit(pageSize(requestedSize))
    .for('update', { skipLocked: true });
}
