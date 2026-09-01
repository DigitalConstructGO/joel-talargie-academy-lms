import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, or, sql, schema } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type {
  PaymentActivityQueryDto,
  PaymentListQueryDto,
} from '../dto/payments.dto';
import type { PaymentSubmission, ValidatedReceipt } from '../payments.types';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }

  async enrollment(studentId: string, enrollmentId: string) {
    const [row] = await this.db
      .select({
        id: schema.enrollments.id,
        studentId: schema.enrollments.studentId,
        courseId: schema.enrollments.courseId,
        status: schema.enrollments.status,
        priceSnapshot: schema.enrollments.priceAtEnrollment,
        discountSnapshot: schema.enrollments.discountAtEnrollment,
        currencySnapshot: schema.enrollments.currencyAtEnrollment,
        userStatus: schema.users.status,
        emailVerified: schema.users.emailVerified,
        courseTitle: schema.courses.title,
        accessType: schema.courses.accessType,
      })
      .from(schema.enrollments)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.enrollments.studentId),
      )
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .where(
        and(
          eq(schema.enrollments.id, enrollmentId),
          eq(schema.enrollments.studentId, studentId),
        ),
      )
      .limit(1);
    if (!row) return null;
    const role = await this.db
      .select({ id: schema.userRoles.userId })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
      .where(
        and(
          eq(schema.userRoles.userId, studentId),
          eq(schema.roles.code, 'STUDENT'),
        ),
      )
      .limit(1);
    const latest = await this.db.query.payments.findFirst({
      where: eq(schema.payments.enrollmentId, enrollmentId),
      orderBy: [desc(schema.payments.attemptNumber)],
    });
    return {
      ...row,
      hasStudentRole: role.length > 0,
      latestPayment: latest ?? null,
    };
  }

  settings() {
    return this.db
      .select({
        key: schema.platformSettings.key,
        value: schema.platformSettings.value,
      })
      .from(schema.platformSettings)
      .where(sql`${schema.platformSettings.key} LIKE 'payment.%'`);
  }

  submit(
    studentId: string,
    enrollmentId: string,
    input: PaymentSubmission,
    receipt: ValidatedReceipt,
    expectedAmount: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM enrollments WHERE id = ${enrollmentId}`,
      );
      const enrollment = await tx.query.enrollments.findFirst({
        where: and(
          eq(schema.enrollments.id, enrollmentId),
          eq(schema.enrollments.studentId, studentId),
        ),
      });
      if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND');
      if (enrollment.status !== 'PENDING_PAYMENT')
        throw new Error('ENROLLMENT_STATUS_INVALID');
      const pending = await tx.query.payments.findFirst({
        where: and(
          eq(schema.payments.enrollmentId, enrollmentId),
          eq(schema.payments.status, 'PENDING'),
        ),
      });
      if (pending) throw new Error('PAYMENT_PENDING_ALREADY_EXISTS');
      const approved = await tx.query.payments.findFirst({
        where: and(
          eq(schema.payments.enrollmentId, enrollmentId),
          eq(schema.payments.status, 'APPROVED'),
        ),
      });
      if (approved) throw new Error('PAYMENT_ALREADY_APPROVED');
      const [{ maximumAttempt = 0 } = {}] = await tx
        .select({
          maximumAttempt: sql<number>`coalesce(max(${schema.payments.attemptNumber}), 0)`,
        })
        .from(schema.payments)
        .where(eq(schema.payments.enrollmentId, enrollmentId));
      const [{ duplicateCount = 0 } = {}] = await tx
        .select({ duplicateCount: count() })
        .from(schema.payments)
        .where(
          and(
            eq(
              schema.payments.transactionIdNormalized,
              input.transactionIdNormalized,
            ),
            eq(schema.payments.enrollmentId, enrollmentId),
          ),
        );
      const amountMismatch = input.amount !== expectedAmount;
      const [payment] = await tx
        .insert(schema.payments)
        .values({
          enrollmentId,
          attemptNumber: Number(maximumAttempt) + 1,
          transactionId: input.transactionId,
          transactionIdNormalized: input.transactionIdNormalized,
          amount: input.amount,
          expectedAmountSnapshot: expectedAmount,
          currency: input.currency,
          paymentDate: input.paymentDate,
          studentNote: input.studentNote,
          paymentMethodId: input.paymentMethodId,
          status: 'PENDING',
          amountMismatch,
          duplicateTransactionCount: Number(duplicateCount),
        })
        .returning();
      if (!payment) throw new Error('PAYMENT_ATTEMPT_CONFLICT');
      await tx.insert(schema.paymentReceipts).values({
        paymentId: payment.id,
        storageKey: receipt.key,
        originalFileName: receipt.originalFileName,
        mimeType: receipt.mimeType,
        detectedMimeType: receipt.detectedMimeType,
        fileExtension: receipt.fileExtension,
        fileSize: receipt.fileSize,
        checksum: receipt.checksum,
        storageProvider: receipt.storageProvider,
      });
      await tx
        .update(schema.enrollments)
        .set({ status: 'WAITING_APPROVAL', updatedAt: new Date() })
        .where(eq(schema.enrollments.id, enrollmentId));
      await tx.insert(schema.activityLogs).values({
        actorId: studentId,
        action: 'payment.submitted',
        entityType: 'payment',
        entityId: payment.id,
        after: {
          enrollmentId,
          attemptNumber: payment.attemptNumber,
          amountMismatch,
        },
      });
      return payment;
    });
  }

  private mineConditions(
    studentId: string,
    query: PaymentListQueryDto,
    enrollmentId?: string,
  ) {
    return [
      eq(schema.enrollments.studentId, studentId),
      enrollmentId ? eq(schema.payments.enrollmentId, enrollmentId) : undefined,
      query.status ? eq(schema.payments.status, query.status) : undefined,
      query.courseId
        ? eq(schema.enrollments.courseId, query.courseId)
        : undefined,
      query.submittedFrom
        ? sql`${schema.payments.submittedAt} >= ${new Date(query.submittedFrom)}`
        : undefined,
      query.submittedTo
        ? sql`${schema.payments.submittedAt} <= ${new Date(query.submittedTo)}`
        : undefined,
    ];
  }

  async listMine(
    studentId: string,
    query: PaymentListQueryDto,
    enrollmentId?: string,
  ) {
    return this.paymentSelect()
      .where(and(...this.mineConditions(studentId, query, enrollmentId)))
      .orderBy(desc(schema.payments.submittedAt), desc(schema.payments.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
  }

  async countMine(
    studentId: string,
    query: PaymentListQueryDto,
    enrollmentId?: string,
  ) {
    const [row] = await this.db
      .select({ value: count() })
      .from(schema.payments)
      .innerJoin(
        schema.enrollments,
        eq(schema.enrollments.id, schema.payments.enrollmentId),
      )
      .where(and(...this.mineConditions(studentId, query, enrollmentId)));
    return Number(row?.value ?? 0);
  }

  mine(studentId: string, paymentId: string) {
    return this.paymentSelect()
      .where(
        and(
          eq(schema.payments.id, paymentId),
          eq(schema.enrollments.studentId, studentId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  private adminConditions(query: PaymentListQueryDto) {
    return [
      query.status ? eq(schema.payments.status, query.status) : undefined,
      query.courseId
        ? eq(schema.enrollments.courseId, query.courseId)
        : undefined,
      query.paymentMethodId
        ? eq(schema.payments.paymentMethodId, query.paymentMethodId)
        : undefined,
      query.amountMismatch === undefined
        ? undefined
        : eq(schema.payments.amountMismatch, query.amountMismatch),
      query.duplicateOnly
        ? sql`(SELECT count(*) FROM payments duplicate_payment WHERE duplicate_payment.transaction_id_normalized = ${schema.payments.transactionIdNormalized} AND duplicate_payment.enrollment_id = ${schema.payments.enrollmentId}) > 1`
        : undefined,
      query.search
        ? sql`(${schema.payments.transactionIdNormalized} ILIKE ${`%${query.search.toUpperCase()}%`} OR ${schema.users.emailNormalized} ILIKE ${`%${query.search.toLowerCase()}%`} OR ${schema.courses.title} ILIKE ${`%${query.search}%`})`
        : undefined,
    ];
  }

  async listAdmin(query: PaymentListQueryDto) {
    return this.adminSelect()
      .where(and(...this.adminConditions(query)))
      .orderBy(desc(schema.payments.submittedAt), desc(schema.payments.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
  }

  async countAdmin(query: PaymentListQueryDto) {
    const [row] = await this.db
      .select({ value: count() })
      .from(schema.payments)
      .innerJoin(
        schema.enrollments,
        eq(schema.enrollments.id, schema.payments.enrollmentId),
      )
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.enrollments.studentId),
      )
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .leftJoin(
        schema.userProfiles,
        eq(schema.userProfiles.userId, schema.enrollments.studentId),
      )
      .where(and(...this.adminConditions(query)));
    return Number(row?.value ?? 0);
  }

  admin(paymentId: string) {
    return this.adminSelect()
      .where(eq(schema.payments.id, paymentId))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  receipt(paymentId: string) {
    return this.db.query.paymentReceipts.findFirst({
      where: eq(schema.paymentReceipts.paymentId, paymentId),
    });
  }

  duplicates(normalized: string, paymentId: string, enrollmentId: string) {
    return this.db
      .select({
        id: schema.payments.id,
        enrollmentId: schema.payments.enrollmentId,
        status: schema.payments.status,
        submittedAt: schema.payments.submittedAt,
      })
      .from(schema.payments)
      .where(
        and(
          eq(schema.payments.transactionIdNormalized, normalized),
          eq(schema.payments.enrollmentId, enrollmentId),
          sql`${schema.payments.id} <> ${paymentId}`,
        ),
      )
      .orderBy(desc(schema.payments.submittedAt))
      .limit(100);
  }

  actorHasPermission(actorId: string, code: string) {
    return this.db
      .select({ id: schema.userRoles.userId })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
      .leftJoin(
        schema.rolePermissions,
        eq(schema.rolePermissions.roleId, schema.userRoles.roleId),
      )
      .leftJoin(
        schema.permissions,
        eq(schema.permissions.id, schema.rolePermissions.permissionId),
      )
      .where(
        and(
          eq(schema.userRoles.userId, actorId),
          or(
            eq(schema.roles.code, 'ADMINISTRATOR'),
            eq(schema.permissions.code, code),
          ),
        ),
      )
      .limit(1)
      .then((rows) => rows.length > 0);
  }

  review(
    actorId: string,
    paymentId: string,
    decision: 'approve' | 'decline',
    input: { reason?: string; reviewNote?: string },
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM payments WHERE id = ${paymentId}`);
      const payment = await tx.query.payments.findFirst({
        where: eq(schema.payments.id, paymentId),
      });
      if (!payment) throw new Error('PAYMENT_NOT_FOUND');
      if (payment.status !== 'PENDING')
        throw new Error('PAYMENT_ALREADY_REVIEWED');
      await tx.execute(
        sql`SELECT id FROM enrollments WHERE id = ${payment.enrollmentId}`,
      );
      const enrollment = await tx.query.enrollments.findFirst({
        where: eq(schema.enrollments.id, payment.enrollmentId),
      });
      if (!enrollment || enrollment.status !== 'WAITING_APPROVAL')
        throw new Error('ENROLLMENT_STATUS_INVALID');
      const receipt = await tx.query.paymentReceipts.findFirst({
        where: eq(schema.paymentReceipts.paymentId, paymentId),
      });
      if (!receipt) throw new Error('RECEIPT_NOT_FOUND');
      const now = new Date();
      const status = decision === 'approve' ? 'APPROVED' : 'DECLINED';
      await tx
        .update(schema.payments)
        .set({
          status,
          reviewerId: actorId,
          reviewedAt: now,
          mismatchApprovalReason: decision === 'approve' ? input.reason : null,
          declineReason: decision === 'decline' ? input.reason : null,
          reviewNote: input.reviewNote,
          updatedAt: now,
        })
        .where(eq(schema.payments.id, paymentId));
      await tx
        .update(schema.enrollments)
        .set({
          status: decision === 'approve' ? 'ENROLLED' : 'PENDING_PAYMENT',
          enrolledAt:
            decision === 'approve'
              ? (enrollment.enrolledAt ?? now)
              : enrollment.enrolledAt,
          updatedAt: now,
        })
        .where(eq(schema.enrollments.id, enrollment.id));
      await tx.insert(schema.activityLogs).values({
        actorId,
        action:
          decision === 'approve' ? 'payment.approved' : 'payment.declined',
        entityType: 'payment',
        entityId: paymentId,
        before: { status: 'PENDING', enrollmentStatus: 'WAITING_APPROVAL' },
        after: {
          status,
          enrollmentStatus:
            decision === 'approve' ? 'ENROLLED' : 'PENDING_PAYMENT',
          reason: input.reason,
        },
      });
      return {
        paymentId,
        status,
        enrollmentStatus:
          decision === 'approve' ? 'ENROLLED' : 'PENDING_PAYMENT',
      };
    });
  }

  activity(paymentId: string, query: PaymentActivityQueryDto) {
    return this.db
      .select({
        id: schema.activityLogs.id,
        actorId: schema.activityLogs.actorId,
        action: schema.activityLogs.action,
        before: schema.activityLogs.before,
        after: schema.activityLogs.after,
        createdAt: schema.activityLogs.createdAt,
      })
      .from(schema.activityLogs)
      .where(
        and(
          eq(schema.activityLogs.entityType, 'payment'),
          eq(schema.activityLogs.entityId, paymentId),
          query.action
            ? eq(schema.activityLogs.action, query.action)
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.activityLogs.createdAt),
        desc(schema.activityLogs.id),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
  }

  private paymentSelect() {
    return this.db
      .select({
        id: schema.payments.id,
        enrollmentId: schema.payments.enrollmentId,
        courseId: schema.enrollments.courseId,
        courseTitle: schema.courses.title,
        attemptNumber: schema.payments.attemptNumber,
        transactionId: schema.payments.transactionId,
        submittedAmount: schema.payments.amount,
        expectedAmount: schema.payments.expectedAmountSnapshot,
        currency: schema.payments.currency,
        paymentDate: schema.payments.paymentDate,
        studentNote: schema.payments.studentNote,
        status: schema.payments.status,
        amountMismatch: schema.payments.amountMismatch,
        declineReason: schema.payments.declineReason,
        submittedAt: schema.payments.submittedAt,
        reviewedAt: schema.payments.reviewedAt,
        paymentMethodId: schema.payments.paymentMethodId,
        paymentMethodName: schema.paymentMethods.name,
        paymentMethodCode: schema.paymentMethods.code,
        paymentMethodType: schema.paymentMethods.type,
        promoCode: schema.promoCodes.code,
        promoDiscountType: schema.promoCodes.discountType,
        promoDiscountValue: schema.promoCodes.discountValue,
        promoOriginalAmount: schema.promoRedemptions.originalPrice,
        promoDiscountAmount: schema.promoRedemptions.discountAmount,
        promoFinalAmount: schema.promoRedemptions.finalPrice,
      })
      .from(schema.payments)
      .innerJoin(
        schema.enrollments,
        eq(schema.enrollments.id, schema.payments.enrollmentId),
      )
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .leftJoin(
        schema.paymentMethods,
        eq(schema.paymentMethods.id, schema.payments.paymentMethodId),
      )
      .leftJoin(
        schema.promoRedemptions,
        eq(schema.promoRedemptions.enrollmentId, schema.enrollments.id),
      )
      .leftJoin(
        schema.promoCodes,
        eq(schema.promoCodes.id, schema.promoRedemptions.codeId),
      );
  }

  private adminSelect() {
    return this.db
      .select({
        id: schema.payments.id,
        enrollmentId: schema.payments.enrollmentId,
        studentId: schema.enrollments.studentId,
        studentEmail: schema.users.email,
        studentName: schema.userProfiles.firstName,
        courseId: schema.enrollments.courseId,
        courseTitle: schema.courses.title,
        attemptNumber: schema.payments.attemptNumber,
        transactionId: schema.payments.transactionId,
        submittedAmount: schema.payments.amount,
        expectedAmount: schema.payments.expectedAmountSnapshot,
        currency: schema.payments.currency,
        paymentDate: schema.payments.paymentDate,
        studentNote: schema.payments.studentNote,
        status: schema.payments.status,
        amountMismatch: schema.payments.amountMismatch,
        duplicateTransactionCount: sql<number>`max((SELECT count(*) FROM payments duplicate_payment WHERE duplicate_payment.transaction_id_normalized = ${schema.payments.transactionIdNormalized} AND duplicate_payment.enrollment_id = ${schema.payments.enrollmentId}) - 1, 0)`,
        declineReason: schema.payments.declineReason,
        reviewNote: schema.payments.reviewNote,
        mismatchApprovalReason: schema.payments.mismatchApprovalReason,
        reviewerId: schema.payments.reviewerId,
        submittedAt: schema.payments.submittedAt,
        reviewedAt: schema.payments.reviewedAt,
        paymentMethodId: schema.payments.paymentMethodId,
        paymentMethodName: schema.paymentMethods.name,
        paymentMethodCode: schema.paymentMethods.code,
        paymentMethodType: schema.paymentMethods.type,
        promoCode: schema.promoCodes.code,
        promoDiscountType: schema.promoCodes.discountType,
        promoDiscountValue: schema.promoCodes.discountValue,
        promoOriginalAmount: schema.promoRedemptions.originalPrice,
        promoDiscountAmount: schema.promoRedemptions.discountAmount,
        promoFinalAmount: schema.promoRedemptions.finalPrice,
      })
      .from(schema.payments)
      .innerJoin(
        schema.enrollments,
        eq(schema.enrollments.id, schema.payments.enrollmentId),
      )
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.enrollments.studentId),
      )
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .leftJoin(
        schema.userProfiles,
        eq(schema.userProfiles.userId, schema.enrollments.studentId),
      )
      .leftJoin(
        schema.paymentMethods,
        eq(schema.paymentMethods.id, schema.payments.paymentMethodId),
      )
      .leftJoin(
        schema.promoRedemptions,
        eq(schema.promoRedemptions.enrollmentId, schema.enrollments.id),
      )
      .leftJoin(
        schema.promoCodes,
        eq(schema.promoCodes.id, schema.promoRedemptions.codeId),
      );
  }
}
