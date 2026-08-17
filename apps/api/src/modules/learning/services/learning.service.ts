import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type { LearningActivityQueryDto } from '../dto/learning.dto';
import { LearningRepository } from '../repositories/learning.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CertificatesService } from '../../certificates/services/certificates.service';
import { CertificateWorkerService } from '../../certificates/workers/certificate-worker.service';
import { STORAGE_SERVICE } from '../../storage/storage.interface';
import type { StorageService } from '../../storage/storage.interface';

@Injectable()
export class LearningService {
  constructor(
    private readonly repository: LearningRepository,
    private readonly notifications: NotificationsService,
    private readonly certificates: CertificatesService,
    private readonly certificateWorker: CertificateWorkerService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async overview(user: AuthUser, enrollmentId: string) {
    const access = await this.requireAccess(user, enrollmentId);
    const rows = await this.repository.curriculum(
      enrollmentId,
      access.courseId,
    );
    return this.presentOverview(access, rows);
  }

  async start(user: AuthUser, enrollmentId: string) {
    await this.requireAccess(user, enrollmentId);
    await this.repository.start(user.id, enrollmentId);
    return this.overview(user, enrollmentId);
  }

  async resume(user: AuthUser, enrollmentId: string) {
    const overview = await this.overview(user, enrollmentId);
    const lessons = overview.curriculum.flatMap((section) => section.lessons);
    const incomplete = lessons.filter(
      (lesson) => lesson.progressStatus !== 'COMPLETED',
    );
    const selected =
      incomplete.find((lesson) => lesson.id === overview.lastLessonId) ??
      [...incomplete]
        .filter((lesson) => lesson.lastViewedAt)
        .sort((a, b) =>
          String(b.lastViewedAt).localeCompare(String(a.lastViewedAt)),
        )[0] ??
      incomplete.find((lesson) => lesson.isMandatory) ??
      incomplete[0] ??
      lessons[0] ??
      null;
    return {
      enrollmentId,
      courseId: overview.course.id,
      lessonId: selected?.id ?? null,
      sectionId: selected?.sectionId ?? null,
      lessonTitle: selected?.title ?? null,
      lessonType: selected?.lessonType ?? null,
      savedPositionSeconds: selected?.savedPositionSeconds ?? 0,
      progressPercentage: overview.progressPercentage,
      courseCompleted: overview.enrollmentStatus === 'COMPLETED',
    };
  }

  async open(user: AuthUser, enrollmentId: string, lessonId: string) {
    const access = await this.requireAccess(user, enrollmentId);
    await this.requireLesson(access.courseId, lessonId);
    await this.repository.open(user.id, enrollmentId, lessonId);
    return this.lesson(user, enrollmentId, lessonId);
  }

  async lesson(user: AuthUser, enrollmentId: string, lessonId: string) {
    const access = await this.requireAccess(user, enrollmentId);
    const lesson = await this.requireLesson(access.courseId, lessonId);
    const rawResources = await this.repository.resources(lessonId);
    const resources = await Promise.all(
      rawResources.map(async (resource) => {
        let downloadUrl = this.safeHttpsUrl(resource.externalUrl);
        if (resource.storageKey) {
          try {
            downloadUrl = await this.storage.getSignedUrl(
              resource.storageKey,
              86400,
            );
          } catch {
            downloadUrl = this.safeHttpsUrl(resource.externalUrl);
          }
        }
        return {
          ...resource,
          externalUrl: downloadUrl,
        };
      }),
    );
    return {
      id: lesson.id,
      sectionId: lesson.sectionId,
      title: lesson.title,
      lessonType: lesson.lessonType,
      durationSeconds: lesson.durationSeconds,
      isMandatory: lesson.isMandatory,
      isPreview: lesson.isPreview,
      content: lesson.content
        ? sanitizeHtml(lesson.content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([
              'img',
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'span',
              'strong',
              'em',
              'code',
              'pre',
              'ul',
              'ol',
              'li',
              'p',
              'br',
              'hr',
              'blockquote',
            ]),
            allowedAttributes: {
              a: ['href', 'target', 'rel'],
              img: ['src', 'alt', 'title'],
              '*': ['class', 'className'],
            },
            allowedSchemes: ['https', 'http'],
          })
        : null,
      videoUrl:
        lesson.lessonType === 'VIDEO'
          ? this.safeHttpsUrl(lesson.videoUrl)
          : null,
      externalUrl:
        lesson.lessonType === 'EXTERNAL_LINK'
          ? this.safeHttpsUrl(lesson.externalUrl)
          : null,
      resources,
    };
  }

  async position(
    user: AuthUser,
    enrollmentId: string,
    lessonId: string,
    positionSeconds: number,
  ) {
    const access = await this.requireAccess(user, enrollmentId);
    const lesson = await this.requireLesson(access.courseId, lessonId);
    if (lesson.lessonType !== 'VIDEO')
      throw new UnprocessableEntityException({
        code: 'LESSON_TYPE_NOT_VIDEO',
        message: 'Playback position applies only to video lessons',
      });
    if (
      lesson.durationSeconds !== null &&
      positionSeconds > lesson.durationSeconds
    )
      throw new UnprocessableEntityException({
        code: 'VIDEO_POSITION_EXCEEDS_DURATION',
        message: 'Playback position exceeds the lesson duration',
      });
    await this.repository.position(
      user.id,
      enrollmentId,
      lessonId,
      positionSeconds,
    );
    return { enrollmentId, lessonId, savedPositionSeconds: positionSeconds };
  }

  async complete(user: AuthUser, enrollmentId: string, lessonId: string) {
    const access = await this.requireAccess(user, enrollmentId);
    const lesson = await this.requireLesson(access.courseId, lessonId);

    // Validate that the student legitimately watched the video before marking it complete
    if (lesson.lessonType === 'VIDEO' && lesson.durationSeconds && lesson.durationSeconds > 10) {
      const progress = await this.repository.findLessonProgress(enrollmentId, lessonId);
      const minRequiredSeconds = Math.floor(lesson.durationSeconds * 0.85);
      const watched = progress?.lastPositionSeconds ?? 0;
      if (progress?.status !== 'COMPLETED' && watched < minRequiredSeconds) {
        throw new UnprocessableEntityException({
          code: 'VIDEO_NOT_COMPLETED',
          message: 'You must watch the video lesson to completion before marking it complete.',
        });
      }
    }

    const result = await this.repository.complete(
      user.id,
      enrollmentId,
      lessonId,
    );

    let certificateId: string | null = null;
    if (result.courseCompleted) {
      await this.notifications
        .notify({
          userId: user.id,
          recipientEmail: user.email,
          recipientName: user.firstName ?? 'Student',
          templateCode: 'COURSE_COMPLETED',
          variables: {
            recipientName: user.firstName ?? 'Student',
            courseTitle: access.courseTitle,
            dashboardUrl: `${process.env.EMAIL_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/my-courses`,
            academyName: 'Joel Talargie Academy',
          },
          deduplicationKey: `course-completed:${enrollmentId}`,
          category: 'learning',
          title: 'Course completed',
          message: `Congratulations! You completed ${access.courseTitle}.`,
          actionUrl: '/dashboard/my-courses',
          relatedEntityType: 'enrollment',
          relatedEntityId: enrollmentId,
        })
        .catch(() => null);

      if (access.certificateEnabled) {
        try {
          const certResult = await this.certificates.request(user, enrollmentId);
          if (certResult?.certificate) {
            certificateId = certResult.certificate.id;
          }
          await this.certificateWorker.tick();
        } catch {
          // Non-blocking if certificate worker is already processing
        }
      }
    }

    return {
      ...result,
      certificateId,
    };
  }

  async adminProgress(enrollmentId: string) {
    const result = await this.repository.adminProgress(enrollmentId);
    if (!result)
      throw new NotFoundException({
        code: 'ENROLLMENT_NOT_FOUND',
        message: 'Enrollment not found',
      });
    return result;
  }

  async adminActivity(enrollmentId: string, query: LearningActivityQueryDto) {
    await this.adminProgress(enrollmentId);
    return this.repository.activity(enrollmentId, query);
  }

  private async requireAccess(user: AuthUser, enrollmentId: string) {
    if (!user.roles.includes('STUDENT'))
      throw new ForbiddenException({
        code: 'STUDENT_ROLE_REQUIRED',
        message: 'Student role required',
      });
    const access = await this.repository.access(user.id, enrollmentId);
    if (!access)
      throw new NotFoundException({
        code: 'ENROLLMENT_NOT_FOUND',
        message: 'Enrollment not found',
      });
    if (access.userStatus !== 'ACTIVE')
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    if (!access.emailVerified)
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verified email required',
      });
    if (!access.hasStudentRole)
      throw new ForbiddenException({
        code: 'STUDENT_ROLE_REQUIRED',
        message: 'Student role required',
      });
    const codes: Record<string, string> = {
      PENDING_PAYMENT: 'PAYMENT_REQUIRED',
      WAITING_APPROVAL: 'PAYMENT_REVIEW_PENDING',
      CANCELLED: 'ENROLLMENT_CANCELLED',
      ACCESS_REVOKED: 'ENROLLMENT_ACCESS_REVOKED',
    };
    const code = codes[access.status];
    if (code)
      throw new ForbiddenException({
        code,
        message: 'Learning access is unavailable',
      });
    return access;
  }

  private async requireLesson(courseId: string, lessonId: string) {
    const lesson = await this.repository.lesson(courseId, lessonId);
    if (!lesson)
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
    if (lesson.sectionCourseId !== courseId)
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
    if (!lesson.isPublished)
      throw new NotFoundException({
        code: 'LESSON_NOT_PUBLISHED',
        message: 'Lesson not found',
      });
    if (lesson.archivedAt || lesson.sectionArchivedAt)
      throw new NotFoundException({
        code: 'LESSON_ARCHIVED',
        message: 'Lesson not found',
      });
    return lesson;
  }

  private presentOverview(
    access: Awaited<ReturnType<LearningRepository['access']>> & object,
    rows: Awaited<ReturnType<LearningRepository['curriculum']>>,
  ) {
    const mandatory = rows.filter((row) => row.isMandatory);
    const optional = rows.filter((row) => !row.isMandatory);
    const mandatoryCompleted = mandatory.filter(
      (row) => row.progressStatus === 'COMPLETED',
    ).length;
    const sections = [...new Set(rows.map((row) => row.sectionId))].map(
      (sectionId) => {
        const sectionRows = rows.filter((row) => row.sectionId === sectionId);
        const required = sectionRows.filter((row) => row.isMandatory);
        const completed = required.filter(
          (row) => row.progressStatus === 'COMPLETED',
        ).length;
        return {
          id: sectionId,
          title: sectionRows[0]?.sectionTitle,
          description: sectionRows[0]?.sectionDescription,
          position: sectionRows[0]?.sectionPosition,
          progressPercentage: required.length
            ? Math.floor((completed * 100) / required.length)
            : 0,
          lessons: sectionRows.map((row) => ({
            id: row.lessonId,
            sectionId,
            title: row.lessonTitle,
            lessonType: row.lessonType,
            durationSeconds: row.durationSeconds,
            position: row.lessonPosition,
            isMandatory: row.isMandatory,
            isPreview: row.isPreview,
            progressStatus: row.progressStatus ?? 'NOT_STARTED',
            firstOpenedAt: row.firstOpenedAt,
            lastViewedAt: row.lastViewedAt,
            completedAt: row.completedAt,
            savedPositionSeconds: row.savedPositionSeconds ?? 0,
            isCurrent: row.lessonId === access.lastLessonId,
          })),
        };
      },
    );
    const flat = sections.flatMap((section) => section.lessons);
    const next =
      flat.find(
        (lesson) => lesson.isMandatory && lesson.progressStatus !== 'COMPLETED',
      ) ??
      flat.find((lesson) => lesson.progressStatus !== 'COMPLETED') ??
      null;
    for (const lesson of flat)
      Object.assign(lesson, { isNextRecommended: lesson.id === next?.id });
    return {
      enrollmentId: access.id,
      enrollmentStatus: access.status,
      progressPercentage: access.progressPercentage,
      startedAt: access.startedAt,
      completedAt: access.completedAt,
      lastLessonId: access.lastLessonId,
      reviewAccess: access.status === 'COMPLETED',
      course: {
        id: access.courseId,
        title: access.courseTitle,
        slug: access.courseSlug,
      },
      mandatoryLessonCount: mandatory.length,
      completedMandatoryLessonCount: mandatoryCompleted,
      optionalLessonCount: optional.length,
      completedOptionalLessonCount: optional.filter(
        (row) => row.progressStatus === 'COMPLETED',
      ).length,
      nextRecommendedLesson: next,
      curriculum: sections,
    };
  }

  private safeHttpsUrl(value: string | null) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
}
