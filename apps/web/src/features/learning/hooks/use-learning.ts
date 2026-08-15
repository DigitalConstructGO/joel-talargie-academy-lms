'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningApi } from '../api/learning.api';
import { learningKeys } from '../api/query-keys';

export function useCourseOverview(enrollmentId: string) {
  return useQuery({
    queryKey: learningKeys.overview(enrollmentId),
    queryFn: () => learningApi.overview(enrollmentId),
    enabled: Boolean(enrollmentId),
  });
}

export function useLesson(enrollmentId: string, lessonId: string | undefined) {
  return useQuery({
    queryKey: learningKeys.lesson(enrollmentId, lessonId ?? ''),
    queryFn: () => learningApi.getLesson(enrollmentId, lessonId!),
    enabled: Boolean(enrollmentId) && Boolean(lessonId),
  });
}

export function useOpenLesson(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => learningApi.openLesson(enrollmentId, lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: learningKeys.overview(enrollmentId) });
    },
  });
}

export function useSavePosition(enrollmentId: string) {
  return useMutation({
    mutationFn: ({ lessonId, positionSeconds }: { lessonId: string; positionSeconds: number }) =>
      learningApi.savePosition(enrollmentId, lessonId, positionSeconds),
  });
}

export function useCompleteLesson(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => learningApi.completeLesson(enrollmentId, lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: learningKeys.overview(enrollmentId) });
      void queryClient.invalidateQueries({ queryKey: ['certificates'] });
      void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
