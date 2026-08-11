'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from '../api/admin-courses.api';
import type {
  AdminCourseListParams,
  AdminCourseSummary,
  CreateCourseInput,
  DuplicateCourseInput,
  UpdateCourseInput,
  UpdatePricingInput,
  UpdateSettingsInput,
  UpdateVisibilityInput,
} from '../types/admin-course.types';

const adminCourseKeys = {
  all: ['admin-courses'] as const,
  lists: () => [...adminCourseKeys.all, 'list'] as const,
  list: (params: AdminCourseListParams) => [...adminCourseKeys.lists(), params] as const,
  detail: (courseId: string) => [...adminCourseKeys.all, 'detail', courseId] as const,
};

export { adminCourseKeys };

export function useAdminCourses(params: AdminCourseListParams = {}) {
  return useQuery({
    queryKey: adminCourseKeys.list(params),
    queryFn: () => adminCoursesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminCourse(courseId: string) {
  return useQuery({
    queryKey: adminCourseKeys.detail(courseId),
    queryFn: () => adminCoursesApi.detail(courseId),
    enabled: Boolean(courseId),
  });
}

function useCourseMutation<TInput = void, TResult = unknown>(
  mutationFn: (courseId: string, input: TInput) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: TInput }) =>
      mutationFn(courseId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminCourseKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: adminCourseKeys.detail(variables.courseId) });
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) => adminCoursesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCourseKeys.lists() });
    },
  });
}

export function useUpdateCourse() {
  return useCourseMutation<UpdateCourseInput>((courseId, input) =>
    adminCoursesApi.update(courseId, input),
  );
}

export function useUpdateCoursePricing() {
  return useCourseMutation<UpdatePricingInput>((courseId, input) =>
    adminCoursesApi.updatePricing(courseId, input),
  );
}

export function useUpdateCourseVisibility() {
  return useCourseMutation<UpdateVisibilityInput>((courseId, input) =>
    adminCoursesApi.updateVisibility(courseId, input),
  );
}

export function useUpdateCourseSettings() {
  return useCourseMutation<UpdateSettingsInput>((courseId, input) =>
    adminCoursesApi.updateSettings(courseId, input),
  );
}

export function useUpdateCourseOutcomes() {
  return useCourseMutation<string[]>((courseId, items) =>
    adminCoursesApi.updateOutcomes(courseId, items),
  );
}

export function useUpdateCourseRequirements() {
  return useCourseMutation<string[]>((courseId, items) =>
    adminCoursesApi.updateRequirements(courseId, items),
  );
}

export function usePublishCourse() {
  return useCourseMutation<void>((courseId) => adminCoursesApi.publish(courseId));
}

export function useUnpublishCourse() {
  return useCourseMutation<void>((courseId) => adminCoursesApi.unpublish(courseId));
}

export function useArchiveCourse() {
  return useCourseMutation<void>((courseId) => adminCoursesApi.archive(courseId));
}

export function useRestoreCourse() {
  return useCourseMutation<void>((courseId) => adminCoursesApi.restore(courseId));
}

export function useDuplicateCourse() {
  return useCourseMutation<DuplicateCourseInput, AdminCourseSummary>((courseId, input) =>
    adminCoursesApi.duplicate(courseId, input),
  );
}
