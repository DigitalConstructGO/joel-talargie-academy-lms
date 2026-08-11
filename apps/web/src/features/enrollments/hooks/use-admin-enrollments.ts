'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminEnrollmentsApi } from '../api/admin-enrollments.api';
import type {
  AdminEnrollmentListParams,
  EnrollmentActivityParams,
} from '../types/admin-enrollment.types';

const adminEnrollmentKeys = {
  all: ['admin-enrollments'] as const,
  lists: () => [...adminEnrollmentKeys.all, 'list'] as const,
  list: (params: AdminEnrollmentListParams) => [...adminEnrollmentKeys.lists(), params] as const,
  detail: (enrollmentId: string) => [...adminEnrollmentKeys.all, 'detail', enrollmentId] as const,
  activity: (enrollmentId: string, params: EnrollmentActivityParams) =>
    [...adminEnrollmentKeys.all, 'activity', enrollmentId, params] as const,
};

export function useAdminEnrollments(params: AdminEnrollmentListParams = {}) {
  return useQuery({
    queryKey: adminEnrollmentKeys.list(params),
    queryFn: () => adminEnrollmentsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminEnrollment(enrollmentId: string) {
  return useQuery({
    queryKey: adminEnrollmentKeys.detail(enrollmentId),
    queryFn: () => adminEnrollmentsApi.detail(enrollmentId),
    enabled: Boolean(enrollmentId),
  });
}

export function useEnrollmentActivity(enrollmentId: string, params: EnrollmentActivityParams = {}) {
  return useQuery({
    queryKey: adminEnrollmentKeys.activity(enrollmentId, params),
    queryFn: () => adminEnrollmentsApi.activity(enrollmentId, params),
    enabled: Boolean(enrollmentId),
  });
}

function useEnrollmentMutation(
  mutationFn: (enrollmentId: string, reason: string) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, reason }: { enrollmentId: string; reason: string }) =>
      mutationFn(enrollmentId, reason),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminEnrollmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: adminEnrollmentKeys.detail(variables.enrollmentId),
      });
    },
  });
}

export function useCancelEnrollment() {
  return useEnrollmentMutation((enrollmentId, reason) =>
    adminEnrollmentsApi.cancel(enrollmentId, reason),
  );
}

export function useRevokeEnrollmentAccess() {
  return useEnrollmentMutation((enrollmentId, reason) =>
    adminEnrollmentsApi.revoke(enrollmentId, reason),
  );
}
