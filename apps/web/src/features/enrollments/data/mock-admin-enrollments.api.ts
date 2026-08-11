import { MOCK_ADMIN_ENROLLMENTS } from './mock-admin-enrollments.data';
import type {
  AdminEnrollment,
  AdminEnrollmentDetail,
  AdminEnrollmentListParams,
  AdminEnrollmentListResult,
  EnrollmentActivityEntry,
  EnrollmentActivityParams,
} from '../types/admin-enrollment.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

const store: AdminEnrollment[] = MOCK_ADMIN_ENROLLMENTS.map((entry) => ({ ...entry }));

export const mockAdminEnrollmentsApi = {
  list: async (params: AdminEnrollmentListParams = {}): Promise<AdminEnrollmentListResult> => {
    const filtered = store.filter((enrollment) => {
      if (params.status && enrollment.status !== params.status) return false;
      if (params.studentId && enrollment.studentId !== params.studentId) return false;
      if (params.courseId && enrollment.courseId !== params.courseId) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (
          !enrollment.studentEmail.toLowerCase().includes(needle) &&
          !enrollment.courseTitle.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: filtered.slice(start, start + pageSize), total: filtered.length });
  },

  detail: async (enrollmentId: string): Promise<AdminEnrollmentDetail> => {
    const enrollment = store.find((entry) => entry.id === enrollmentId);
    if (!enrollment) notFound('Enrollment not found');
    return delay({ ...enrollment, paymentAttempts: 1 });
  },

  cancel: async (enrollmentId: string, _reason: string): Promise<AdminEnrollment> => {
    const enrollment = store.find((entry) => entry.id === enrollmentId);
    if (!enrollment) notFound('Enrollment not found');
    enrollment.status = 'CANCELLED';
    enrollment.cancelledAt = new Date().toISOString();
    enrollment.hasLearningAccess = false;
    return delay(enrollment);
  },

  revoke: async (enrollmentId: string, _reason: string): Promise<AdminEnrollment> => {
    const enrollment = store.find((entry) => entry.id === enrollmentId);
    if (!enrollment) notFound('Enrollment not found');
    enrollment.status = 'ACCESS_REVOKED';
    enrollment.accessRevokedAt = new Date().toISOString();
    enrollment.hasLearningAccess = false;
    return delay(enrollment);
  },

  activity: async (
    _enrollmentId: string,
    _params: EnrollmentActivityParams,
  ): Promise<EnrollmentActivityEntry[]> => delay([]),
};
