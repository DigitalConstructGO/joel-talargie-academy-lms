import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  AdminEnrollment,
  AdminEnrollmentDetail,
  AdminEnrollmentListParams,
  AdminEnrollmentListResult,
  EnrollmentActivityEntry,
  EnrollmentActivityParams,
} from '../types/admin-enrollment.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

/** Talks to the real backend's admin enrollment endpoints. */
export const adminEnrollmentsApi = {
  list: async (params: AdminEnrollmentListParams = {}) =>
    unwrap<AdminEnrollmentListResult>(
      await authClient.get('/admin/enrollments', { params: cleanParams(params) }),
    ),

  detail: async (enrollmentId: string) =>
    unwrap<AdminEnrollmentDetail>(
      await authClient.get(`/admin/enrollments/${encodeURIComponent(enrollmentId)}`),
    ),

  cancel: async (enrollmentId: string, reason: string) =>
    unwrap<AdminEnrollment>(
      await authClient.post(`/admin/enrollments/${encodeURIComponent(enrollmentId)}/cancel`, {
        reason,
      }),
    ),

  revoke: async (enrollmentId: string, reason: string) =>
    unwrap<AdminEnrollment>(
      await authClient.post(
        `/admin/enrollments/${encodeURIComponent(enrollmentId)}/revoke-access`,
        { reason },
      ),
    ),

  activity: async (enrollmentId: string, params: EnrollmentActivityParams = {}) =>
    unwrap<EnrollmentActivityEntry[]>(
      await authClient.get(`/admin/enrollments/${encodeURIComponent(enrollmentId)}/activity`, {
        params: cleanParams(params),
      }),
    ),
};
