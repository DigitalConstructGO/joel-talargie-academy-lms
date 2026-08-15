'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '../api/enrollments.api';
import { enrollmentKeys } from '../api/query-keys';
import type { EnrollmentListParams } from '../types/enrollment.types';

export function useMyEnrollments(params: EnrollmentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.list(params),
    queryFn: () => enrollmentsApi.listMine(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}


export function useEnrollmentByCourse(courseId: string) {
  return useQuery({
    queryKey: enrollmentKeys.byCourse(courseId),
    queryFn: () => enrollmentsApi.getByCourse(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, redemptionId }: { courseId: string; redemptionId?: string }) =>
      enrollmentsApi.create(courseId, redemptionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}
