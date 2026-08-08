import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockEnrollmentsApi } from '../data/mock-enrollments.api';
import type {
  Enrollment,
  EnrollmentCreateResult,
  EnrollmentListParams,
  EnrollmentListResult,
} from '../types/enrollment.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

export interface EnrollmentByCourseResult {
  enrolled: boolean;
  enrollment: Enrollment | null;
  nextAction?: string;
}

/** Talks to the real backend's authenticated `/me/enrollments` endpoints. */
const liveEnrollmentsApi = {
  listMine: async (params: EnrollmentListParams = {}) =>
    unwrap<EnrollmentListResult>(
      await authClient.get('/me/enrollments', { params: cleanParams(params) }),
    ),

  getByCourse: async (courseId: string) =>
    unwrap<EnrollmentByCourseResult>(
      await authClient.get(`/me/enrollments/course/${encodeURIComponent(courseId)}`),
    ),

  create: async (courseId: string, redemptionId?: string) =>
    unwrap<EnrollmentCreateResult>(
      await authClient.post('/enrollments', { courseId, redemptionId }),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const enrollmentsApi =
  CATALOG_DATA_SOURCE === 'live' ? liveEnrollmentsApi : mockEnrollmentsApi;
