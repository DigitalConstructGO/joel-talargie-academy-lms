import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminEnrollmentsApi } from '../data/mock-admin-enrollments.api';
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

const liveAdminEnrollmentsApi = {
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

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const adminEnrollmentsApi =
  CATALOG_DATA_SOURCE === 'live' ? liveAdminEnrollmentsApi : mockAdminEnrollmentsApi;
