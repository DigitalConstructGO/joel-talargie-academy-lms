import { Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  inArray,
  sql,
  schema,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import {
  assertValidMoneySnapshot,
  SEAT_RESERVING_STATUSES,
} from '../constants/enrollment.constants';
import type {
  EnrollmentActivityQueryDto,
  ListAdminEnrollmentsDto,
  ListMyEnrollmentsDto,
} from '../dto/enrollment.dto';

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }

  create(studentId: string, courseId: string, redemptionId?: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM courses WHERE id = ${courseId}`);
      const [user, course] = await Promise.all([
        tx.query.users.findFirst({ where: eq(schema.users.id, studentId) }),
        tx.query.courses.findFirst({ where: eq(schema.courses.id, courseId) }),
      ]);
      if (!user) throw new Error('USER_NOT_FOUND');
      if (user.status !== 'ACTIVE') throw new Error('ACCOUNT_NOT_ACTIVE');
      if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED');
      const studentRole = await tx
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
      if (!studentRole.length) throw new Error('STUDENT_ROLE_REQUIRED');
      if (!course) throw new Error('COURSE_NOT_FOUND');
      if (course.archivedAt) throw new Error('COURSE_ARCHIVED');
      if (course.status !== 'PUBLISHED')
        throw new Error('COURSE_NOT_PUBLISHED');
      if (course.visibility === 'PRIVATE') throw new Error('COURSE_PRIVATE');
      const category = await tx.query.categories.findFirst({
        where: eq(schema.categories.id, course.categoryId),
      });
      if (!category?.isActive || category.archivedAt)
        throw new Error('COURSE_CATEGORY_INACTIVE');
      const existing = await tx.query.enrollments.findFirst({
        where: and(
          eq(schema.enrollments.studentId, studentId),
          eq(schema.enrollments.courseId, courseId),
        ),
      });
      if (existing) {
        if (existing.status === 'CANCELLED')
          throw new Error('ENROLLMENT_CANCELLED');
        if (existing.status === 'ACCESS_REVOKED')
          throw new Error('ENROLLMENT_ACCESS_REVOKED');
        await tx.insert(schema.activityLogs).values({
          actorId: studentId,
          action: 'enrollment.existing_returned',
          entityType: 'enrollment',
          entityId: existing.id,
          after: { courseId, status: existing.status },
        });
        return { created: false, enrollment: existing };
      }
      const now = new Date();
      if (course.enrollmentOpenAt && now < course.enrollmentOpenAt)
        throw new Error('ENROLLMENT_NOT_OPEN');
      if (course.enrollmentCloseAt && now > course.enrollmentCloseAt)
        throw new Error('ENROLLMENT_CLOSED');
      if (course.capacity !== null) {
        const [{ seats = 0 } = {}] = await tx
          .select({ seats: count() })
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.courseId, courseId),
              inArray(schema.enrollments.status, [...SEAT_RESERVING_STATUSES]),
            ),
          );
        if (Number(seats) >= course.capacity) {
          await tx.insert(schema.activityLogs).values({
            actorId: studentId,
            action: 'enrollment.capacity_rejected',
            entityType: 'course',
            entityId: courseId,
          });
          throw new Error('COURSE_CAPACITY_REACHED');
        }
      }
      // A promo redemption, if supplied, is re-validated here under a row
      // lock rather than trusted from the caller - this is the only place
      // that can safely close the TOCTOU window between "redemption looked
      // valid" and "redemption gets spent on an enrollment".
      let redemption: typeof schema.promoRedemptions.$inferSelect | undefined;
      if (redemptionId) {
        await tx.execute(
          sql`SELECT id FROM promo_redemptions WHERE id = ${redemptionId}`,
        );
        redemption = await tx.query.promoRedemptions.findFirst({
          where: eq(schema.promoRedemptions.id, redemptionId),
        });
        if (
          !redemption ||
          redemption.studentId !== studentId ||
          redemption.courseId !== courseId ||
          redemption.status !== 'CONFIRMED' ||
          redemption.enrollmentId
        )
          throw new Error('REDEMPTION_NOT_AVAILABLE');
      }
      const effectivelyFree =
        course.accessType === 'FREE' ||
        (redemption ? Number(redemption.finalPrice) === 0 : false);
      const status = effectivelyFree ? 'ENROLLED' : 'PENDING_PAYMENT';
      const priceSnapshot = assertValidMoneySnapshot(
        effectivelyFree ? '0.00' : (redemption?.originalPrice ?? course.price),
      );
      const discountSnapshot = assertValidMoneySnapshot(
        effectivelyFree
          ? '0.00'
          : (redemption?.finalPrice ?? course.discountPrice ?? '0.00'),
      );
      const [enrollment] = await tx
        .insert(schema.enrollments)
        .values({
          studentId,
          courseId,
          status,
          priceAtEnrollment: priceSnapshot,
          discountAtEnrollment: discountSnapshot,
          currencyAtEnrollment: course.currency,
          progressPercentage: 0,
          enrolledAt: status === 'ENROLLED' ? now : null,
        })
        .returning();
      if (!enrollment) throw new Error('ENROLLMENT_CREATE_FAILED');
      if (redemption)
        await tx
          .update(schema.promoRedemptions)
          .set({ enrollmentId: enrollment.id, updatedAt: now })
          .where(eq(schema.promoRedemptions.id, redemption.id));
      await tx.insert(schema.activityLogs).values({
        actorId: studentId,
        action: 'enrollment.created',
        entityType: 'enrollment',
        entityId: enrollment.id,
        after: {
          courseId,
          status,
          priceAtEnrollment: enrollment.priceAtEnrollment,
          currencyAtEnrollment: enrollment.currencyAtEnrollment,
          redemptionId: redemption?.id ?? null,
        },
      });
      return { created: true, enrollment };
    });
  }

  async listMine(studentId: string, query: ListMyEnrollmentsDto) {
    const conditions = [
      eq(schema.enrollments.studentId, studentId),
      query.status ? eq(schema.enrollments.status, query.status) : undefined,
      query.enrollmentStatuses?.length
        ? inArray(schema.enrollments.status, query.enrollmentStatuses)
        : undefined,
      query.categoryId
        ? eq(schema.courses.categoryId, query.categoryId)
        : undefined,
      query.search
        ? sql`(${schema.courses.title} ILIKE ${`%${query.search}%`} OR ${schema.courses.slug} ILIKE ${`%${query.search}%`})`
        : undefined,
    ];
    const items = await this.studentSelect()
      .where(and(...conditions))
      .orderBy(desc(schema.enrollments.updatedAt), desc(schema.enrollments.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    const [{ total = 0 } = {}] = await this.db
      .select({ total: count() })
      .from(schema.enrollments)
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .where(and(...conditions));
    return { items, total: Number(total) };
  }
  studentEnrollment(studentId: string, enrollmentId: string) {
    return this.studentSelect()
      .where(
        and(
          eq(schema.enrollments.id, enrollmentId),
          eq(schema.enrollments.studentId, studentId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }
  studentCourse(studentId: string, courseId: string) {
    return this.studentSelect()
      .where(
        and(
          eq(schema.enrollments.studentId, studentId),
          eq(schema.enrollments.courseId, courseId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }
  private studentSelect() {
    return this.db
      .select({
        id: schema.enrollments.id,
        courseId: schema.enrollments.courseId,
        status: schema.enrollments.status,
        priceSnapshot: schema.enrollments.priceAtEnrollment,
        discountSnapshot: schema.enrollments.discountAtEnrollment,
        currencySnapshot: schema.enrollments.currencyAtEnrollment,
        progressPercentage: schema.enrollments.progressPercentage,
        enrolledAt: schema.enrollments.enrolledAt,
        startedAt: schema.enrollments.startedAt,
        completedAt: schema.enrollments.completedAt,
        createdAt: schema.enrollments.createdAt,
        updatedAt: schema.enrollments.updatedAt,
        courseTitle: schema.courses.title,
        courseSlug: schema.courses.slug,
        thumbnailKey: schema.courses.thumbnailKey,
        categoryId: schema.categories.id,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
      })
      .from(schema.enrollments)
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .innerJoin(
        schema.categories,
        eq(schema.categories.id, schema.courses.categoryId),
      );
  }

  async listAdmin(query: ListAdminEnrollmentsDto) {
    const conditions = [
      query.status ? eq(schema.enrollments.status, query.status) : undefined,
      query.studentId
        ? eq(schema.enrollments.studentId, query.studentId)
        : undefined,
      query.courseId
        ? eq(schema.enrollments.courseId, query.courseId)
        : undefined,
      query.categoryId
        ? eq(schema.courses.categoryId, query.categoryId)
        : undefined,
      query.createdFrom
        ? sql`${schema.enrollments.createdAt} >= ${new Date(query.createdFrom)}`
        : undefined,
      query.createdTo
        ? sql`${schema.enrollments.createdAt} <= ${new Date(query.createdTo)}`
        : undefined,
      query.search
        ? sql`(${schema.users.emailNormalized} ILIKE ${`%${query.search.toLowerCase()}%`} OR ${schema.courses.title} ILIKE ${`%${query.search}%`})`
        : undefined,
    ];
    const items = await this.adminSelect()
      .where(and(...conditions))
      .orderBy(desc(schema.enrollments.createdAt), desc(schema.enrollments.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    const [{ total = 0 } = {}] = await this.db
      .select({ total: count() })
      .from(schema.enrollments)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.enrollments.studentId),
      )
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .where(and(...conditions));
    return { items, total: Number(total) };
  }
  adminEnrollment(id: string) {
    return this.adminSelect()
      .where(eq(schema.enrollments.id, id))
      .limit(1)
      .then(async (rows) => {
        const enrollment = rows[0];
        if (!enrollment) return null;
        const [{ paymentAttempts = 0 } = {}] = await this.db
          .select({ paymentAttempts: count() })
          .from(schema.payments)
          .where(eq(schema.payments.enrollmentId, id));
        return { ...enrollment, paymentAttempts: Number(paymentAttempts) };
      });
  }
  private adminSelect() {
    return this.db
      .select({
        id: schema.enrollments.id,
        studentId: schema.enrollments.studentId,
        studentEmail: schema.users.email,
        firstName: schema.userProfiles.firstName,
        lastName: schema.userProfiles.lastName,
        courseId: schema.enrollments.courseId,
        courseTitle: schema.courses.title,
        courseSlug: schema.courses.slug,
        status: schema.enrollments.status,
        priceSnapshot: schema.enrollments.priceAtEnrollment,
        discountSnapshot: schema.enrollments.discountAtEnrollment,
        currencySnapshot: schema.enrollments.currencyAtEnrollment,
        progressPercentage: schema.enrollments.progressPercentage,
        enrolledAt: schema.enrollments.enrolledAt,
        startedAt: schema.enrollments.startedAt,
        completedAt: schema.enrollments.completedAt,
        cancelledAt: schema.enrollments.cancelledAt,
        cancellationReason: schema.enrollments.cancellationReason,
        accessRevokedAt: schema.enrollments.accessRevokedAt,
        accessRevocationReason: schema.enrollments.accessRevocationReason,
        createdAt: schema.enrollments.createdAt,
        updatedAt: schema.enrollments.updatedAt,
      })
      .from(schema.enrollments)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.enrollments.studentId),
      )
      .leftJoin(
        schema.userProfiles,
        eq(schema.userProfiles.userId, schema.users.id),
      )
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      );
  }

  transition(
    actorId: string,
    enrollmentId: string,
    operation: 'cancel' | 'revoke',
    reason: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM enrollments WHERE id = ${enrollmentId}`,
      );
      const enrollment = await tx.query.enrollments.findFirst({
        where: eq(schema.enrollments.id, enrollmentId),
      });
      if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND');
      const allowed =
        operation === 'cancel'
          ? ['PENDING_PAYMENT', 'WAITING_APPROVAL', 'ENROLLED'].includes(
              enrollment.status,
            )
          : ['ENROLLED', 'IN_PROGRESS'].includes(enrollment.status);
      if (!allowed)
        throw new Error(
          operation === 'cancel'
            ? 'ENROLLMENT_CANNOT_BE_CANCELLED'
            : 'ENROLLMENT_CANNOT_BE_REVOKED',
        );
      const now = new Date();
      const status = operation === 'cancel' ? 'CANCELLED' : 'ACCESS_REVOKED';
      const [updated] = await tx
        .update(schema.enrollments)
        .set({
          status,
          updatedAt: now,
          ...(operation === 'cancel'
            ? {
                cancelledAt: now,
                cancelledBy: actorId,
                cancellationReason: reason,
              }
            : { accessRevokedAt: now, accessRevocationReason: reason }),
        })
        .where(eq(schema.enrollments.id, enrollmentId))
        .returning();
      await tx.insert(schema.activityLogs).values({
        actorId,
        action:
          operation === 'cancel'
            ? 'enrollment.cancelled'
            : 'enrollment.access_revoked',
        entityType: 'enrollment',
        entityId: enrollmentId,
        before: { status: enrollment.status },
        after: {
          status,
          reason,
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
        },
      });
      return updated;
    });
  }
  activity(enrollmentId: string, query: EnrollmentActivityQueryDto) {
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
          eq(schema.activityLogs.entityType, 'enrollment'),
          eq(schema.activityLogs.entityId, enrollmentId),
          query.action
            ? eq(schema.activityLogs.action, query.action)
            : undefined,
          query.createdFrom
            ? sql`${schema.activityLogs.createdAt} >= ${new Date(query.createdFrom)}`
            : undefined,
          query.createdTo
            ? sql`${schema.activityLogs.createdAt} <= ${new Date(query.createdTo)}`
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
}
