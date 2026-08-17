import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';
import type { CourseLesson, CourseSection } from '@/features/catalog/types/catalog.types';
import { mockCertificatesApi } from '@/features/certificates/data/mock-certificates.api';
import { mockLessonTextContent, MOCK_LESSON_VIDEO_URL } from './mock-learning.data';
import type {
  CompleteLessonResult,
  CourseOverview,
  CurriculumLesson,
  CurriculumSection,
  LessonContent,
  LessonProgressStatus,
  LessonResource,
  ResumeTarget,
} from '../types/learning.types';

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

interface DemoLearningEnrollment {
  id: string;
  courseId: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
}

function demoEnrollment(
  courseIndex: number,
  id: string,
  status: DemoLearningEnrollment['status'],
  progressPercentage: number,
  startedDaysAgo: number,
  completedDaysAgo: number | null,
): DemoLearningEnrollment | null {
  const record = MOCK_COURSE_RECORDS[courseIndex];
  if (!record) return null;
  return {
    id,
    courseId: record.id,
    status,
    progressPercentage,
    startedAt: progressPercentage > 0 ? new Date(Date.now() - startedDaysAgo * 86_400_000).toISOString() : null,
    completedAt: status === 'COMPLETED' && completedDaysAgo !== null
      ? new Date(Date.now() - completedDaysAgo * 86_400_000).toISOString()
      : null,
  };
}

const DEMO_ENROLLMENTS: DemoLearningEnrollment[] = [
  demoEnrollment(0, 'enrollment-001', 'IN_PROGRESS', 72, 34, null),
  demoEnrollment(2, 'enrollment-002', 'IN_PROGRESS', 18, 6, null),
  demoEnrollment(4, 'enrollment-003', 'COMPLETED', 100, 90, 20),
  demoEnrollment(6, 'enrollment-004', 'ENROLLED', 0, 1, null),
  demoEnrollment(8, 'enrollment-005', 'IN_PROGRESS', 45, 15, null),
  demoEnrollment(10, 'enrollment-006', 'COMPLETED', 100, 150, 60),
  demoEnrollment(12, 'enrollment-007', 'COMPLETED', 100, 80, 10),
].filter((entry): entry is DemoLearningEnrollment => entry !== null);

interface ProgressEntry {
  status: LessonProgressStatus;
  firstOpenedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
  savedPositionSeconds: number;
}

/** enrollmentId -> lessonId -> progress. In-memory only, reset on page reload - mock mode is a demo, not persistence. */
const progressStore = new Map<string, Map<string, ProgressEntry>>();

function progressFor(enrollmentId: string): Map<string, ProgressEntry> {
  let entries = progressStore.get(enrollmentId);
  if (!entries) {
    entries = new Map();
    progressStore.set(enrollmentId, entries);
  }
  return entries;
}

function findCourse(courseId: string) {
  const course = MOCK_COURSE_RECORDS.find((record) => record.id === courseId);
  if (!course) notFound('Course not found');
  return course;
}

function findEnrollment(enrollmentId: string) {
  const enrollment = DEMO_ENROLLMENTS.find((entry) => entry.id === enrollmentId);
  if (!enrollment) notFound('Enrollment not found');
  return enrollment;
}

function findLesson(
  sections: CourseSection[],
  lessonId: string,
): { section: CourseSection; lesson: CourseLesson } {
  for (const section of sections) {
    const lesson = section.lessons.find((entry) => entry.id === lessonId);
    if (lesson) return { section, lesson };
  }
  notFound('Lesson not found');
}

function buildCurriculum(enrollmentId: string, sections: CourseSection[]): CurriculumSection[] {
  const entries = progressFor(enrollmentId);
  const flatForNextLookup = sections.flatMap((section) => section.lessons);
  const firstIncompleteMandatory = flatForNextLookup.find(
    (lesson) => lesson.isMandatory && entries.get(lesson.id)?.status !== 'COMPLETED',
  );

  return sections.map((section, sectionIndex) => {
    const required = section.lessons.filter((lesson) => lesson.isMandatory);
    const completed = required.filter(
      (lesson) => entries.get(lesson.id)?.status === 'COMPLETED',
    ).length;
    const lessons: CurriculumLesson[] = section.lessons.map((lesson, lessonIndex) => {
      const progress = entries.get(lesson.id);
      return {
        id: lesson.id,
        sectionId: section.id,
        title: lesson.title,
        lessonType: lesson.lessonType,
        durationSeconds: lesson.durationSeconds,
        position: lessonIndex,
        isMandatory: lesson.isMandatory,
        isPreview: lesson.isPreview,
        progressStatus: progress?.status ?? 'NOT_STARTED',
        firstOpenedAt: progress?.firstOpenedAt ?? null,
        lastViewedAt: progress?.lastViewedAt ?? null,
        completedAt: progress?.completedAt ?? null,
        savedPositionSeconds: progress?.savedPositionSeconds ?? 0,
        isCurrent: false,
        isNextRecommended: lesson.id === firstIncompleteMandatory?.id,
      };
    });
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      position: sectionIndex,
      progressPercentage: required.length ? Math.floor((completed * 100) / required.length) : 0,
      lessons,
    };
  });
}

async function buildOverview(enrollmentId: string): Promise<CourseOverview> {
  const enrollment = findEnrollment(enrollmentId);
  const course = findCourse(enrollment.courseId);
  const curriculum = buildCurriculum(enrollmentId, course.sections);
  const flat = curriculum.flatMap((section) => section.lessons);
  const mandatory = flat.filter((lesson) => lesson.isMandatory);
  const optional = flat.filter((lesson) => !lesson.isMandatory);
  const nextRecommended = flat.find((lesson) => lesson.isNextRecommended) ?? null;

  return {
    enrollmentId,
    enrollmentStatus: enrollment.status,
    progressPercentage: enrollment.progressPercentage,
    startedAt: enrollment.startedAt,
    completedAt: enrollment.completedAt,
    lastLessonId: null,
    reviewAccess: enrollment.status === 'COMPLETED',
    course: { id: course.id, title: course.title, slug: course.slug },
    mandatoryLessonCount: mandatory.length,
    completedMandatoryLessonCount: mandatory.filter(
      (lesson) => lesson.progressStatus === 'COMPLETED',
    ).length,
    optionalLessonCount: optional.length,
    completedOptionalLessonCount: optional.filter((lesson) => lesson.progressStatus === 'COMPLETED')
      .length,
    nextRecommendedLesson: nextRecommended,
    curriculum,
  };
}

function buildLessonContent(lesson: CourseLesson, sectionId: string): LessonContent {
  const resources: LessonResource[] = (lesson.resources ?? []).map((r, idx) => ({
    id: r.id || `res-${idx + 1}`,
    label: r.title,
    resourceType: r.mimeType || 'DOCUMENT',
    externalUrl: r.externalUrl ?? null,
    originalFileName: r.originalFileName ?? null,
    mimeType: r.mimeType ?? null,
    fileSize: r.fileSize ?? null,
    visibility: 'PUBLIC',
    position: idx + 1,
  }));

  return {
    id: lesson.id,
    sectionId,
    title: lesson.title,
    lessonType: lesson.lessonType,
    durationSeconds: lesson.durationSeconds,
    isMandatory: lesson.isMandatory,
    isPreview: lesson.isPreview,
    content:
      lesson.content ??
      (lesson.lessonType === 'TEXT' ? mockLessonTextContent(lesson.title) : null),
    videoUrl: lesson.lessonType === 'VIDEO' ? (lesson.videoUrl ?? MOCK_LESSON_VIDEO_URL) : null,
    externalUrl:
      lesson.externalUrl ??
      (lesson.lessonType === 'EXTERNAL_LINK' ? 'https://example.com' : null),
    resources,
  };
}

export const mockLearningApi = {
  overview: async (enrollmentId: string): Promise<CourseOverview> =>
    delay(await buildOverview(enrollmentId)),

  start: async (enrollmentId: string): Promise<CourseOverview> =>
    delay(await buildOverview(enrollmentId)),

  resume: async (enrollmentId: string): Promise<ResumeTarget> => {
    const overview = await buildOverview(enrollmentId);
    const flat = overview.curriculum.flatMap((section) => section.lessons);
    const incomplete = flat.filter((lesson) => lesson.progressStatus !== 'COMPLETED');
    const selected =
      incomplete.find((lesson) => lesson.isMandatory) ?? incomplete[0] ?? flat[0] ?? null;
    return delay({
      enrollmentId,
      courseId: overview.course.id,
      lessonId: selected?.id ?? null,
      sectionId: selected?.sectionId ?? null,
      lessonTitle: selected?.title ?? null,
      lessonType: selected?.lessonType ?? null,
      savedPositionSeconds: selected?.savedPositionSeconds ?? 0,
      progressPercentage: overview.progressPercentage,
      courseCompleted: overview.enrollmentStatus === 'COMPLETED',
    });
  },

  openLesson: async (enrollmentId: string, lessonId: string): Promise<LessonContent> => {
    const enrollment = findEnrollment(enrollmentId);
    const course = findCourse(enrollment.courseId);
    const { section, lesson } = findLesson(course.sections, lessonId);
    const entries = progressFor(enrollmentId);
    const now = new Date().toISOString();
    const existing = entries.get(lessonId);
    entries.set(lessonId, {
      status: existing?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      firstOpenedAt: existing?.firstOpenedAt ?? now,
      lastViewedAt: now,
      completedAt: existing?.completedAt ?? null,
      savedPositionSeconds: existing?.savedPositionSeconds ?? 0,
    });
    return delay(buildLessonContent(lesson, section.id));
  },

  getLesson: async (enrollmentId: string, lessonId: string): Promise<LessonContent> => {
    const enrollment = findEnrollment(enrollmentId);
    const course = findCourse(enrollment.courseId);
    const { section, lesson } = findLesson(course.sections, lessonId);
    return delay(buildLessonContent(lesson, section.id));
  },

  savePosition: async (
    enrollmentId: string,
    lessonId: string,
    positionSeconds: number,
  ): Promise<{ enrollmentId: string; lessonId: string; savedPositionSeconds: number }> => {
    const entries = progressFor(enrollmentId);
    const now = new Date().toISOString();
    const existing = entries.get(lessonId);
    entries.set(lessonId, {
      status: existing?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      firstOpenedAt: existing?.firstOpenedAt ?? now,
      lastViewedAt: now,
      completedAt: existing?.completedAt ?? null,
      savedPositionSeconds: positionSeconds,
    });
    return delay({ enrollmentId, lessonId, savedPositionSeconds: positionSeconds });
  },

  completeLesson: async (enrollmentId: string, lessonId: string): Promise<CompleteLessonResult> => {
    const enrollment = findEnrollment(enrollmentId);
    const course = findCourse(enrollment.courseId);
    const entries = progressFor(enrollmentId);
    const now = new Date().toISOString();
    const existing = entries.get(lessonId);
    entries.set(lessonId, {
      status: 'COMPLETED',
      firstOpenedAt: existing?.firstOpenedAt ?? now,
      lastViewedAt: now,
      completedAt: existing?.completedAt ?? now,
      savedPositionSeconds: existing?.savedPositionSeconds ?? 0,
    });
    const mandatory = course.sections
      .flatMap((section) => section.lessons)
      .filter((lesson) => lesson.isMandatory);
    const completed = mandatory.filter(
      (lesson) => entries.get(lesson.id)?.status === 'COMPLETED',
    ).length;
    const progressPercentage = mandatory.length
      ? Math.floor((completed * 100) / mandatory.length)
      : 0;

    const courseCompleted = mandatory.length > 0 && completed >= mandatory.length;
    if (courseCompleted) {
      void mockCertificatesApi.request(enrollmentId).catch(() => null);
    }

    return delay({
      progressPercentage,
      courseCompleted,
    });
  },
};
