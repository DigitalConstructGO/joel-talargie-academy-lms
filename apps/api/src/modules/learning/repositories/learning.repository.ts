import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  sql,
  schema,
} from '@joel-academy/database';
import type { AcademyDatabase } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type { LearningActivityQueryDto } from '../dto/learning.dto';

const ACCESS_STATUSES = ['ENROLLED', 'IN_PROGRESS', 'COMPLETED'] as const;

@Injectable()
export class LearningRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }

  async access(studentId: string, enrollmentId: string) {
    const [row] = await this.db
      .select({
        id: schema.enrollments.id,
        studentId: schema.enrollments.studentId,
        courseId: schema.enrollments.courseId,
        status: schema.enrollments.status,
        progressPercentage: schema.enrollments.progressPercentage,
        lastLessonId: schema.enrollments.lastLessonId,
        startedAt: schema.enrollments.startedAt,
        completedAt: schema.enrollments.completedAt,
        userStatus: schema.users.status,
        emailVerified: schema.users.emailVerified,
        courseTitle: schema.courses.title,
        courseSlug: schema.courses.slug,
        certificateEnabled: schema.courses.certificateEnabled,
        courseArchivedAt: schema.courses.archivedAt,
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
    return { ...row, hasStudentRole: role.length > 0 };
  }

  lesson(courseId: string, lessonId: string) {
    return this.db
      .select({
        id: schema.lessons.id,
        courseId: schema.lessons.courseId,
        sectionId: schema.lessons.sectionId,
        title: schema.lessons.title,
        lessonType: schema.lessons.lessonType,
        content: schema.lessons.content,
        videoUrl: schema.lessons.videoUrl,
        externalUrl: schema.lessons.externalUrl,
        durationSeconds: schema.lessons.durationSeconds,
        isMandatory: schema.lessons.isMandatory,
        isPreview: schema.lessons.isPreview,
        isPublished: schema.lessons.isPublished,
        archivedAt: schema.lessons.archivedAt,
        sectionCourseId: schema.courseSections.courseId,
        sectionArchivedAt: schema.courseSections.archivedAt,
      })
      .from(schema.lessons)
      .innerJoin(
        schema.courseSections,
        eq(schema.courseSections.id, schema.lessons.sectionId),
      )
      .where(
        and(
          eq(schema.lessons.id, lessonId),
          eq(schema.lessons.courseId, courseId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  findLessonProgress(enrollmentId: string, lessonId: string) {
    return this.db.query.lessonProgress.findFirst({
      where: and(
        eq(schema.lessonProgress.enrollmentId, enrollmentId),
        eq(schema.lessonProgress.lessonId, lessonId),
      ),
    });
  }

  curriculum(enrollmentId: string, courseId: string) {
    return this.db
      .select({
        sectionId: schema.courseSections.id,
        sectionTitle: schema.courseSections.title,
        sectionDescription: schema.courseSections.description,
        sectionPosition: schema.courseSections.position,
        lessonId: schema.lessons.id,
        lessonTitle: schema.lessons.title,
        lessonType: schema.lessons.lessonType,
        durationSeconds: schema.lessons.durationSeconds,
        lessonPosition: schema.lessons.position,
        isMandatory: schema.lessons.isMandatory,
        isPreview: schema.lessons.isPreview,
        progressStatus: schema.lessonProgress.status,
        firstOpenedAt: schema.lessonProgress.firstOpenedAt,
        lastViewedAt: schema.lessonProgress.lastViewedAt,
        completedAt: schema.lessonProgress.completedAt,
        savedPositionSeconds: schema.lessonProgress.lastPositionSeconds,
      })
      .from(schema.courseSections)
      .innerJoin(
        schema.lessons,
        eq(schema.lessons.sectionId, schema.courseSections.id),
      )
      .leftJoin(
        schema.lessonProgress,
        and(
          eq(schema.lessonProgress.lessonId, schema.lessons.id),
          eq(schema.lessonProgress.enrollmentId, enrollmentId),
        ),
      )
      .where(
        and(
          eq(schema.courseSections.courseId, courseId),
          sql`${schema.courseSections.archivedAt} IS NULL`,
          eq(schema.lessons.isPublished, true),
          sql`${schema.lessons.archivedAt} IS NULL`,
        ),
      )
      .orderBy(
        asc(schema.courseSections.position),
        asc(schema.lessons.position),
        asc(schema.lessons.id),
      );
  }

  resources(lessonId: string) {
    return this.db
      .select({
        id: schema.lessonResources.id,
        label: schema.lessonResources.label,
        resourceType: schema.lessonResources.resourceType,
        storageKey: schema.lessonResources.storageKey,
        externalUrl: schema.lessonResources.externalUrl,
        originalFileName: schema.lessonResources.originalFileName,
        mimeType: schema.lessonResources.mimeType,
        fileSize: schema.lessonResources.fileSize,
        visibility: schema.lessonResources.visibility,
        position: schema.lessonResources.position,
      })
      .from(schema.lessonResources)
      .where(
        and(
          eq(schema.lessonResources.lessonId, lessonId),
          inArray(schema.lessonResources.visibility, [
            'PUBLIC',
            'ENROLLED_STUDENTS',
          ]),
        ),
      )
      .orderBy(
        asc(schema.lessonResources.position),
        asc(schema.lessonResources.id),
      );
  }

  start(studentId: string, enrollmentId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM enrollments WHERE id = ${enrollmentId} FOR UPDATE`,
      );
      const enrollment = await tx.query.enrollments.findFirst({
        where: and(
          eq(schema.enrollments.id, enrollmentId),
          eq(schema.enrollments.studentId, studentId),
        ),
      });
      if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND');
      if (
        !ACCESS_STATUSES.includes(
          enrollment.status as (typeof ACCESS_STATUSES)[number],
        )
      )
        throw new Error('ENROLLMENT_ACCESS_DENIED');
      if (enrollment.status === 'ENROLLED') {
        const now = new Date();
        await tx
          .update(schema.enrollments)
          .set({
            status: 'IN_PROGRESS',
            startedAt: enrollment.startedAt ?? now,
            updatedAt: now,
          })
          .where(eq(schema.enrollments.id, enrollmentId));
        await tx.insert(schema.activityLogs).values({
          actorId: studentId,
          action: 'course.learning_started',
          entityType: 'enrollment',
          entityId: enrollmentId,
          before: { status: 'ENROLLED' },
          after: { status: 'IN_PROGRESS', courseId: enrollment.courseId },
        });
      }
    });
  }

  open(studentId: string, enrollmentId: string, lessonId: string) {
    return this.db.transaction(async (tx) => {
      const enrollment = await this.lockAccessible(tx, studentId, enrollmentId);
      const now = new Date();
      await tx
        .insert(schema.lessonProgress)
        .values({
          enrollmentId,
          lessonId,
          status: 'IN_PROGRESS',
          firstOpenedAt: now,
          lastViewedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            schema.lessonProgress.enrollmentId,
            schema.lessonProgress.lessonId,
          ],
          set: {
            lastViewedAt: now,
            updatedAt: now,
            status: sql`CASE WHEN ${schema.lessonProgress.status} = 'COMPLETED' THEN 'COMPLETED'::progress_status ELSE 'IN_PROGRESS'::progress_status END`,
            firstOpenedAt: sql`COALESCE(${schema.lessonProgress.firstOpenedAt}, ${now})`,
          },
        });
      await tx
        .update(schema.enrollments)
        .set({
          lastLessonId: lessonId,
          status:
            enrollment.status === 'ENROLLED'
              ? 'IN_PROGRESS'
              : enrollment.status,
          startedAt: enrollment.startedAt ?? now,
          updatedAt: now,
        })
        .where(eq(schema.enrollments.id, enrollmentId));
      await tx.insert(schema.activityLogs).values({
        actorId: studentId,
        action: 'lesson.opened',
        entityType: 'enrollment',
        entityId: enrollmentId,
        after: { lessonId },
      });
    });
  }

  position(
    studentId: string,
    enrollmentId: string,
    lessonId: string,
    positionSeconds: number,
  ) {
    return this.db.transaction(async (tx) => {
      const enrollment = await this.lockAccessible(tx, studentId, enrollmentId);
      const now = new Date();
      await tx
        .insert(schema.lessonProgress)
        .values({
          enrollmentId,
          lessonId,
          status: 'IN_PROGRESS',
          firstOpenedAt: now,
          lastViewedAt: now,
          lastPositionSeconds: positionSeconds,
        })
        .onConflictDoUpdate({
          target: [
            schema.lessonProgress.enrollmentId,
            schema.lessonProgress.lessonId,
          ],
          set: {
            lastPositionSeconds: positionSeconds,
            lastViewedAt: now,
            firstOpenedAt: sql`COALESCE(${schema.lessonProgress.firstOpenedAt}, ${now})`,
            updatedAt: now,
            status: sql`CASE WHEN ${schema.lessonProgress.status} = 'COMPLETED' THEN 'COMPLETED'::progress_status ELSE 'IN_PROGRESS'::progress_status END`,
          },
        });
      await tx
        .update(schema.enrollments)
        .set({
          lastLessonId: lessonId,
          status:
            enrollment.status === 'ENROLLED'
              ? 'IN_PROGRESS'
              : enrollment.status,
          startedAt: enrollment.startedAt ?? now,
          updatedAt: now,
        })
        .where(eq(schema.enrollments.id, enrollmentId));
    });
  }

  complete(studentId: string, enrollmentId: string, lessonId: string) {
    return this.db.transaction(async (tx) => {
      const enrollment = await this.lockAccessible(
        tx,
        studentId,
        enrollmentId,
        true,
      );
      const now = new Date();
      const existingProgress = await tx.query.lessonProgress.findFirst({
        where: and(
          eq(schema.lessonProgress.enrollmentId, enrollmentId),
          eq(schema.lessonProgress.lessonId, lessonId),
        ),
      });
      await tx
        .insert(schema.lessonProgress)
        .values({
          enrollmentId,
          lessonId,
          status: 'COMPLETED',
          progressPercent: 100,
          firstOpenedAt: now,
          lastViewedAt: now,
          completedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            schema.lessonProgress.enrollmentId,
            schema.lessonProgress.lessonId,
          ],
          set: {
            status: 'COMPLETED',
            progressPercent: 100,
            lastViewedAt: now,
            completedAt: sql`COALESCE(${schema.lessonProgress.completedAt}, ${now})`,
            firstOpenedAt: sql`COALESCE(${schema.lessonProgress.firstOpenedAt}, ${now})`,
            updatedAt: now,
          },
        });
      const [{ mandatoryTotal = 0, mandatoryCompleted = 0 } = {}] = await tx
        .select({
          mandatoryTotal: count(schema.lessons.id),
          mandatoryCompleted: sql<number>`count(${schema.lessonProgress.id}) filter (where ${schema.lessonProgress.status} = 'COMPLETED')`,
        })
        .from(schema.lessons)
        .leftJoin(
          schema.lessonProgress,
          and(
            eq(schema.lessonProgress.lessonId, schema.lessons.id),
            eq(schema.lessonProgress.enrollmentId, enrollmentId),
          ),
        )
        .where(
          and(
            eq(schema.lessons.courseId, enrollment.courseId),
            eq(schema.lessons.isMandatory, true),
            eq(schema.lessons.isPublished, true),
            sql`${schema.lessons.archivedAt} IS NULL`,
          ),
        );
      const total = Number(mandatoryTotal);
      const completed = Number(mandatoryCompleted);
      const progressPercentage =
        total === 0 ? 0 : Math.floor((completed * 100) / total);
      const newlyCompleted =
        total > 0 && completed >= total && enrollment.status !== 'COMPLETED';
      await tx
        .update(schema.enrollments)
        .set({
          lastLessonId: lessonId,
          progressPercentage:
            newlyCompleted || enrollment.status === 'COMPLETED'
              ? 100
              : progressPercentage,
          status: newlyCompleted
            ? 'COMPLETED'
            : enrollment.status === 'ENROLLED'
              ? 'IN_PROGRESS'
              : enrollment.status,
          startedAt: enrollment.startedAt ?? now,
          completedAt: newlyCompleted ? now : enrollment.completedAt,
          updatedAt: now,
        })
        .where(eq(schema.enrollments.id, enrollmentId));
      if (existingProgress?.status !== 'COMPLETED')
        await tx.insert(schema.activityLogs).values({
          actorId: studentId,
          action: 'lesson.completed',
          entityType: 'enrollment',
          entityId: enrollmentId,
          after: { lessonId, progressPercentage },
        });
      if (newlyCompleted) {
        await tx.insert(schema.activityLogs).values({
          actorId: studentId,
          action: 'course.completed',
          entityType: 'enrollment',
          entityId: enrollmentId,
          after: { courseId: enrollment.courseId, progressPercentage: 100 },
        });
        if (enrollment.certificateEnabled)
          await tx
            .insert(schema.backgroundJobs)
            .values({
              jobType: 'CERTIFICATE_GENERATION_REQUESTED',
              deduplicationKey: `certificate:enrollment:${enrollmentId}`,
              payload: {
                enrollmentId,
                courseId: enrollment.courseId,
                studentId,
              },
            })
            .onConflictDoNothing();
      }
      return {
        progressPercentage:
          newlyCompleted || enrollment.status === 'COMPLETED'
            ? 100
            : progressPercentage,
        courseCompleted: newlyCompleted || enrollment.status === 'COMPLETED',
      };
    });
  }

  async adminProgress(enrollmentId: string) {
    const enrollment = await this.db.query.enrollments.findFirst({
      where: eq(schema.enrollments.id, enrollmentId),
    });
    if (!enrollment) return null;
    return {
      enrollment,
      curriculum: await this.curriculum(enrollmentId, enrollment.courseId),
    };
  }

  activity(enrollmentId: string, query: LearningActivityQueryDto) {
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

  /**
   * `withCourse` defaults to false: `open()`/`position()` (the latter fires
   * on every video-position heartbeat - the single highest-frequency write
   * in the app) never read `certificateEnabled`, so they skip the extra
   * course round trip. Only `complete()` needs it, to decide whether to
   * queue certificate generation.
   */
  private async lockAccessible(
    tx: Parameters<Parameters<AcademyDatabase['transaction']>[0]>[0],
    studentId: string,
    enrollmentId: string,
    withCourse = false,
  ) {
    await tx.execute(
      sql`SELECT id FROM enrollments WHERE id = ${enrollmentId} FOR UPDATE`,
    );
    const enrollment = await tx.query.enrollments.findFirst({
      where: and(
        eq(schema.enrollments.id, enrollmentId),
        eq(schema.enrollments.studentId, studentId),
      ),
    });
    if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND');
    if (
      !ACCESS_STATUSES.includes(
        enrollment.status as (typeof ACCESS_STATUSES)[number],
      )
    )
      throw new Error('ENROLLMENT_ACCESS_DENIED');
    if (!withCourse) return { ...enrollment, certificateEnabled: false };
    const course = await tx.query.courses.findFirst({
      where: eq(schema.courses.id, enrollment.courseId),
    });
    return {
      ...enrollment,
      certificateEnabled: course?.certificateEnabled ?? false,
    };
  }
}
