'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCurriculumApi } from '../api/admin-curriculum.api';
import { adminCourseKeys } from './use-admin-courses';
import type {
  CreateLessonInput,
  CreateResourceInput,
  CreateSectionInput,
  ReorderItem,
  UpdateLessonInput,
  UpdateResourceInput,
  UpdateSectionInput,
} from '../types/admin-curriculum.types';

/** Every curriculum mutation invalidates the parent course detail query - that's the single source of truth for the sections/lessons/resources tree. */
function useCurriculumMutation<TArgs extends unknown[], TResult>(
  mutationFn: (courseId: string, ...args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, args }: { courseId: string; args: TArgs }) =>
      mutationFn(courseId, ...args),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminCourseKeys.detail(variables.courseId) });
    },
  });
}

export function useCreateSection() {
  return useCurriculumMutation<[CreateSectionInput], unknown>((courseId, input) =>
    adminCurriculumApi.createSection(courseId, input),
  );
}

export function useUpdateSection() {
  return useCurriculumMutation<[string, UpdateSectionInput], unknown>(
    (_courseId, sectionId, input) => adminCurriculumApi.updateSection(sectionId, input),
  );
}

export function useArchiveSection() {
  return useCurriculumMutation<[string], unknown>((_courseId, sectionId) =>
    adminCurriculumApi.archiveSection(sectionId),
  );
}

export function useReorderSections() {
  return useCurriculumMutation<[ReorderItem[]], unknown>((courseId, items) =>
    adminCurriculumApi.reorderSections(courseId, items),
  );
}

export function useCreateLesson() {
  return useCurriculumMutation<[string, CreateLessonInput], unknown>(
    (_courseId, sectionId, input) => adminCurriculumApi.createLesson(sectionId, input),
  );
}

export function useUpdateLesson() {
  return useCurriculumMutation<[string, UpdateLessonInput], unknown>((_courseId, lessonId, input) =>
    adminCurriculumApi.updateLesson(lessonId, input),
  );
}

export function useMoveLesson() {
  return useCurriculumMutation<[string, string, number | undefined], unknown>(
    (_courseId, lessonId, sectionId, sortOrder) =>
      adminCurriculumApi.moveLesson(lessonId, sectionId, sortOrder),
  );
}

export function useReorderLessons() {
  return useCurriculumMutation<[string, ReorderItem[]], unknown>((_courseId, sectionId, items) =>
    adminCurriculumApi.reorderLessons(sectionId, items),
  );
}

export function usePublishLesson() {
  return useCurriculumMutation<[string], unknown>((_courseId, lessonId) =>
    adminCurriculumApi.publishLesson(lessonId),
  );
}

export function useUnpublishLesson() {
  return useCurriculumMutation<[string], unknown>((_courseId, lessonId) =>
    adminCurriculumApi.unpublishLesson(lessonId),
  );
}

export function usePreviewLesson() {
  return useCurriculumMutation<[string, boolean], unknown>((_courseId, lessonId, isPreview) =>
    adminCurriculumApi.previewLesson(lessonId, isPreview),
  );
}

export function useArchiveLesson() {
  return useCurriculumMutation<[string], unknown>((_courseId, lessonId) =>
    adminCurriculumApi.archiveLesson(lessonId),
  );
}

export function useCreateResource() {
  return useCurriculumMutation<[string, CreateResourceInput], unknown>(
    (_courseId, lessonId, input) => adminCurriculumApi.createResource(lessonId, input),
  );
}

export function useUpdateResource() {
  return useCurriculumMutation<[string, UpdateResourceInput], unknown>(
    (_courseId, resourceId, input) => adminCurriculumApi.updateResource(resourceId, input),
  );
}

export function useDeleteResource() {
  return useCurriculumMutation<[string], unknown>((_courseId, resourceId) =>
    adminCurriculumApi.deleteResource(resourceId),
  );
}
