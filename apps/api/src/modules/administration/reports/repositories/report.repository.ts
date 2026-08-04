import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  schema,
  sql,
} from '@joel-academy/database';
import { DatabaseService } from '../../../../common/database/database.service';
import { ReportQueryDto } from '../dto/reports.dto';
import type { ReportType } from '../report.types';

@Injectable()
export class ReportRepository {
  constructor(private readonly database: DatabaseService) {}
  private dates(column: any, q: ReportQueryDto) {
    return [
      q.from ? gte(column, new Date(q.from)) : undefined,
      q.to ? lte(column, new Date(q.to)) : undefined,
    ];
  }
  async query(type: ReportType, q: ReportQueryDto) {
    const offset = (q.page - 1) * q.pageSize;
    const order = (c: any) => (q.sortDirection === 'asc' ? asc(c) : desc(c));
    if (type === 'USER_REGISTRATIONS' || type === 'USER_ACCOUNT_STATUS') {
      const where = and(
        ...this.dates(schema.users.createdAt, q),
        q.status ? eq(schema.users.status, q.status as any) : undefined,
        q.search
          ? or(
              ilike(schema.users.email, `%${q.search}%`),
              ilike(schema.userProfiles.firstName, `%${q.search}%`),
              ilike(schema.userProfiles.lastName, `%${q.search}%`),
            )
          : undefined,
      );
      const base = this.database.client
        .select({
          id: schema.users.id,
          firstName: schema.userProfiles.firstName,
          lastName: schema.userProfiles.lastName,
          email: schema.users.email,
          status: schema.users.status,
          emailVerified: schema.users.emailVerified,
          provider: schema.users.provider,
          createdAt: schema.users.createdAt,
          lastLoginAt: schema.users.lastLoginAt,
        })
        .from(schema.users)
        .leftJoin(
          schema.userProfiles,
          eq(schema.userProfiles.userId, schema.users.id),
        )
        .where(where);
      const [rows, total, summary] = await Promise.all([
        base
          .orderBy(order(schema.users.createdAt), order(schema.users.id))
          .limit(q.pageSize)
          .offset(offset),
        this.database.client
          .select({ value: count() })
          .from(schema.users)
          .leftJoin(
            schema.userProfiles,
            eq(schema.userProfiles.userId, schema.users.id),
          )
          .where(where),
        this.database.client
          .select({ status: schema.users.status, total: count() })
          .from(schema.users)
          .where(where)
          .groupBy(schema.users.status),
      ]);
      return {
        rows,
        total: Number(total[0]?.value ?? 0),
        summary: {
          total: Number(total[0]?.value ?? 0),
          byStatus: Object.fromEntries(
            summary.map((x) => [x.status, Number(x.total)]),
          ),
        },
      };
    }
    if (
      type === 'ADMINISTRATOR_ACTIVITY' ||
      type === 'AUTHENTICATION_SECURITY_EVENTS'
    ) {
      const security =
        type === 'AUTHENTICATION_SECURITY_EVENTS'
          ? or(
              ilike(schema.activityLogs.action, '%login%'),
              ilike(schema.activityLogs.action, '%password%'),
              ilike(schema.activityLogs.action, '%role%'),
              ilike(schema.activityLogs.action, '%auth%'),
            )
          : undefined;
      const where = and(
        ...this.dates(schema.activityLogs.createdAt, q),
        q.actorId ? eq(schema.activityLogs.actorId, q.actorId) : undefined,
        security,
      );
      const [rows, total] = await Promise.all([
        this.database.client
          .select({
            id: schema.activityLogs.id,
            actorId: schema.activityLogs.actorId,
            action: schema.activityLogs.action,
            entityType: schema.activityLogs.entityType,
            entityId: schema.activityLogs.entityId,
            before: schema.activityLogs.before,
            after: schema.activityLogs.after,
            ipAddress: schema.activityLogs.ipAddress,
            userAgent: schema.activityLogs.userAgent,
            createdAt: schema.activityLogs.createdAt,
          })
          .from(schema.activityLogs)
          .where(where)
          .orderBy(
            order(schema.activityLogs.createdAt),
            order(schema.activityLogs.id),
          )
          .limit(q.pageSize)
          .offset(offset),
        this.database.client
          .select({ value: count() })
          .from(schema.activityLogs)
          .where(where),
      ]);
      return {
        rows,
        total: Number(total[0]?.value ?? 0),
        summary: { total: Number(total[0]?.value ?? 0) },
      };
    }
    if (
      type === 'PAYMENTS' ||
      type === 'REVENUE' ||
      type === 'PAYMENT_REVIEW_PERFORMANCE'
    ) {
      const revenue =
        type === 'REVENUE' ? eq(schema.payments.status, 'APPROVED') : undefined;
      const where = and(
        ...this.dates(schema.payments.submittedAt, q),
        q.status ? eq(schema.payments.status, q.status as any) : undefined,
        revenue,
      );
      const [rows, total, sums] = await Promise.all([
        this.database.client
          .select({
            id: schema.payments.id,
            enrollmentId: schema.payments.enrollmentId,
            status: schema.payments.status,
            attemptNumber: schema.payments.attemptNumber,
            amount: schema.payments.amount,
            expectedAmount: schema.payments.expectedAmountSnapshot,
            currency: schema.payments.currency,
            amountMismatch: schema.payments.amountMismatch,
            submittedAt: schema.payments.submittedAt,
            reviewedAt: schema.payments.reviewedAt,
            reviewerId: schema.payments.reviewerId,
            declineReason: schema.payments.declineReason,
            reviewNote: schema.payments.reviewNote,
          })
          .from(schema.payments)
          .where(where)
          .orderBy(
            order(schema.payments.submittedAt),
            order(schema.payments.id),
          )
          .limit(q.pageSize)
          .offset(offset),
        this.database.client
          .select({ value: count() })
          .from(schema.payments)
          .where(where),
        this.database.client
          .select({
            currency: schema.payments.currency,
            total: sql<string>`sum(${schema.payments.amount})`,
          })
          .from(schema.payments)
          .where(where)
          .groupBy(schema.payments.currency),
      ]);
      return {
        rows,
        total: Number(total[0]?.value ?? 0),
        summary: {
          total: Number(total[0]?.value ?? 0),
          amountsByCurrency: Object.fromEntries(
            sums.map((x) => [x.currency, x.total]),
          ),
        },
      };
    }
    if (type === 'CERTIFICATES' || type === 'CERTIFICATE_GENERATION') {
      const where = and(
        ...this.dates(schema.certificates.createdAt, q),
        q.status ? eq(schema.certificates.status, q.status as any) : undefined,
      );
      const [rows, total] = await Promise.all([
        this.database.client
          .select({
            id: schema.certificates.id,
            enrollmentId: schema.certificates.enrollmentId,
            status: schema.certificates.status,
            certificateNumber: schema.certificates.certificateNumber,
            studentName: schema.certificates.studentNameAtIssue,
            courseTitle: schema.certificates.courseTitleAtIssue,
            issuedAt: schema.certificates.issuedAt,
            generatedAt: schema.certificates.generatedAt,
            revokedAt: schema.certificates.revokedAt,
          })
          .from(schema.certificates)
          .where(where)
          .orderBy(
            order(schema.certificates.createdAt),
            order(schema.certificates.id),
          )
          .limit(q.pageSize)
          .offset(offset),
        this.database.client
          .select({ value: count() })
          .from(schema.certificates)
          .where(where),
      ]);
      return {
        rows,
        total: Number(total[0]?.value ?? 0),
        summary: { total: Number(total[0]?.value ?? 0) },
      };
    }
    const completion =
      type === 'COURSE_COMPLETIONS'
        ? eq(schema.enrollments.status, 'COMPLETED')
        : undefined;
    const where = and(
      ...this.dates(schema.enrollments.createdAt, q),
      q.status ? eq(schema.enrollments.status, q.status as any) : undefined,
      q.courseId ? eq(schema.enrollments.courseId, q.courseId) : undefined,
      q.studentId ? eq(schema.enrollments.studentId, q.studentId) : undefined,
      completion,
    );
    const [rows, total] = await Promise.all([
      this.database.client
        .select({
          id: schema.enrollments.id,
          studentId: schema.enrollments.studentId,
          courseId: schema.enrollments.courseId,
          status: schema.enrollments.status,
          price: schema.enrollments.priceAtEnrollment,
          discount: schema.enrollments.discountAtEnrollment,
          currency: schema.enrollments.currencyAtEnrollment,
          progress: schema.enrollments.progressPercentage,
          createdAt: schema.enrollments.createdAt,
          startedAt: schema.enrollments.startedAt,
          completedAt: schema.enrollments.completedAt,
        })
        .from(schema.enrollments)
        .where(where)
        .orderBy(
          order(schema.enrollments.createdAt),
          order(schema.enrollments.id),
        )
        .limit(q.pageSize)
        .offset(offset),
      this.database.client
        .select({ value: count() })
        .from(schema.enrollments)
        .where(where),
    ]);
    return {
      rows,
      total: Number(total[0]?.value ?? 0),
      summary: { total: Number(total[0]?.value ?? 0) },
    };
  }
}
