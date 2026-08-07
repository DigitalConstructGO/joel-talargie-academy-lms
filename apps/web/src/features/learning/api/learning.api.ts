import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockLearningApi } from '../data/mock-learning.api';
import type {
  CompleteLessonResult,
  CourseOverview,
  LessonContent,
  ResumeTarget,
} from '../types/learning.types';

const base = (enrollmentId: string) =>
  `/me/learning/enrollments/${encodeURIComponent(enrollmentId)}`;

/** Talks to the real backend's authenticated `/me/learning/enrollments/*` endpoints. */
const liveLearningApi = {
  overview: async (enrollmentId: string) =>
    unwrap<CourseOverview>(await authClient.get(base(enrollmentId))),

  start: async (enrollmentId: string) =>
    unwrap<CourseOverview>(await authClient.post(`${base(enrollmentId)}/start`)),

  resume: async (enrollmentId: string) =>
    unwrap<ResumeTarget>(await authClient.get(`${base(enrollmentId)}/resume`)),

  openLesson: async (enrollmentId: string, lessonId: string) =>
    unwrap<LessonContent>(
      await authClient.post(`${base(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/open`),
    ),

  getLesson: async (enrollmentId: string, lessonId: string) =>
    unwrap<LessonContent>(
      await authClient.get(`${base(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}`),
    ),

  savePosition: async (enrollmentId: string, lessonId: string, positionSeconds: number) =>
    unwrap<{ enrollmentId: string; lessonId: string; savedPositionSeconds: number }>(
      await authClient.patch(
        `${base(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/position`,
        {
          positionSeconds,
        },
      ),
    ),

  completeLesson: async (enrollmentId: string, lessonId: string) =>
    unwrap<CompleteLessonResult>(
      await authClient.post(
        `${base(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/complete`,
      ),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const learningApi = CATALOG_DATA_SOURCE === 'live' ? liveLearningApi : mockLearningApi;
