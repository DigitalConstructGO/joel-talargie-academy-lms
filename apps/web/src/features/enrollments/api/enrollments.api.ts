import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  Enrollment,
  EnrollmentCreateResult,
  EnrollmentListParams,
  EnrollmentListResult,
} from '../types/enrollment.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '' && value !== null)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value]),
  );

export interface EnrollmentByCourseResult {
  enrolled: boolean;
  enrollment: Enrollment | null;
  nextAction?: string;
}

/** Talks to the real backend's authenticated `/me/enrollments` endpoints. */
export const enrollmentsApi = {
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
