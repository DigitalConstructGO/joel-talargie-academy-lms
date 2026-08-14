import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  AdminLessonDetail,
  AdminLessonResource,
  CreateLessonInput,
  CreateResourceInput,
  CreateSectionInput,
  ReorderItem,
  UpdateLessonInput,
  UpdateResourceInput,
  UpdateSectionInput,
} from '../types/admin-curriculum.types';
import type { AdminCourseSection } from '../types/admin-course.types';

const liveAdminCurriculumApi = {
  createSection: async (courseId: string, input: CreateSectionInput) =>
    unwrap<AdminCourseSection>(
      await authClient.post(`/admin/courses/${encodeURIComponent(courseId)}/sections`, input),
    ),

  updateSection: async (sectionId: string, input: UpdateSectionInput) =>
    unwrap<AdminCourseSection>(
      await authClient.patch(`/admin/sections/${encodeURIComponent(sectionId)}`, input),
    ),

  archiveSection: async (sectionId: string) =>
    unwrap<void>(await authClient.delete(`/admin/sections/${encodeURIComponent(sectionId)}`)),

  reorderSections: async (courseId: string, items: ReorderItem[]) =>
    unwrap<void>(
      await authClient.put(`/admin/courses/${encodeURIComponent(courseId)}/sections/reorder`, {
        items,
      }),
    ),

  createLesson: async (sectionId: string, input: CreateLessonInput) =>
    unwrap<AdminLessonDetail>(
      await authClient.post(`/admin/sections/${encodeURIComponent(sectionId)}/lessons`, input),
    ),

  updateLesson: async (lessonId: string, input: UpdateLessonInput) =>
    unwrap<AdminLessonDetail>(
      await authClient.patch(`/admin/lessons/${encodeURIComponent(lessonId)}`, input),
    ),

  moveLesson: async (lessonId: string, sectionId: string, sortOrder?: number) =>
    unwrap<AdminLessonDetail>(
      await authClient.post(`/admin/lessons/${encodeURIComponent(lessonId)}/move`, {
        sectionId,
        sortOrder,
      }),
    ),

  reorderLessons: async (sectionId: string, items: ReorderItem[]) =>
    unwrap<void>(
      await authClient.put(`/admin/sections/${encodeURIComponent(sectionId)}/lessons/reorder`, {
        items,
      }),
    ),

  publishLesson: async (lessonId: string) =>
    unwrap<AdminLessonDetail>(
      await authClient.post(`/admin/lessons/${encodeURIComponent(lessonId)}/publish`),
    ),

  unpublishLesson: async (lessonId: string) =>
    unwrap<AdminLessonDetail>(
      await authClient.post(`/admin/lessons/${encodeURIComponent(lessonId)}/unpublish`),
    ),

  previewLesson: async (lessonId: string, isPreview: boolean) =>
    unwrap<AdminLessonDetail>(
      await authClient.put(`/admin/lessons/${encodeURIComponent(lessonId)}/preview`, { isPreview }),
    ),

  archiveLesson: async (lessonId: string) =>
    unwrap<void>(await authClient.delete(`/admin/lessons/${encodeURIComponent(lessonId)}`)),

  createResource: async (lessonId: string, input: CreateResourceInput) =>
    unwrap<AdminLessonResource>(
      await authClient.post(`/admin/lessons/${encodeURIComponent(lessonId)}/resources`, input),
    ),

  updateResource: async (resourceId: string, input: UpdateResourceInput) =>
    unwrap<AdminLessonResource>(
      await authClient.patch(`/admin/lesson-resources/${encodeURIComponent(resourceId)}`, input),
    ),

  deleteResource: async (resourceId: string) =>
    unwrap<void>(
      await authClient.delete(`/admin/lesson-resources/${encodeURIComponent(resourceId)}`),
    ),
};

/** Live curriculum-management API - the admin curriculum builder is always DB-backed. */
export const adminCurriculumApi = liveAdminCurriculumApi;
