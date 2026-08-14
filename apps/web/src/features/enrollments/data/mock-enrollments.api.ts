import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';
import { MOCK_ENROLLMENTS } from './mock-enrollments.data';
import type {
  Enrollment,
  EnrollmentCreateResult,
  EnrollmentListParams,
  EnrollmentListResult,
} from '../types/enrollment.types';

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function paginate<T>(items: T[], page = 1, pageSize = 20): { items: T[]; total: number } {
  const total = items.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total };
}

/** Module-level mutable copy so `create()` has somewhere to write in mock mode. */
let store: Enrollment[] = MOCK_ENROLLMENTS.map((enrollment) => ({ ...enrollment }));

function filterEnrollments(params: EnrollmentListParams) {
  return store
    .filter((enrollment) => {
      if (params.status && enrollment.status !== params.status) return false;
      if (
        params.enrollmentStatuses?.length &&
        !params.enrollmentStatuses.includes(enrollment.status)
      )
        return false;
      if (params.categoryId && enrollment.categoryId !== params.categoryId) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (!enrollment.courseTitle.toLowerCase().includes(needle)) return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const mockEnrollmentsApi = {
  listMine: async (params: EnrollmentListParams = {}): Promise<EnrollmentListResult> => {
    const { items, total } = paginate(
      filterEnrollments(params),
      params.page,
      params.pageSize ?? 20,
    );
    return delay({ items, total });
  },

  getByCourse: async (courseId: string) => {
    const enrollment = store.find((entry) => entry.courseId === courseId) ?? null;
    return delay(
      enrollment
        ? { enrolled: true, enrollment }
        : { enrolled: false, enrollment: null, nextAction: 'ENROLL' },
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for signature parity with `liveEnrollmentsApi.create`
  create: async (courseId: string, redemptionId?: string): Promise<EnrollmentCreateResult> => {
    const existing = store.find((entry) => entry.courseId === courseId);
    if (existing) return delay({ created: false, enrollment: existing });

    const record = MOCK_COURSE_RECORDS.find((course) => course.id === courseId);
    if (!record) {
      const error = new Error('Course not found') as Error & { response?: { status: number } };
      error.response = { status: 404 };
      throw error;
    }
    const isFree = record.accessType === 'FREE';
    const now = new Date().toISOString();
    const enrollment: Enrollment = {
      id: `enrollment-${Date.now()}`,
      courseId: record.id,
      status: isFree ? 'ENROLLED' : 'PENDING_PAYMENT',
      priceSnapshot: record.price,
      discountSnapshot: record.discountPrice,
      currencySnapshot: record.currency,
      progressPercentage: 0,
      enrolledAt: isFree ? now : null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      courseTitle: record.title,
      courseSlug: record.slug,
      thumbnailKey: record.thumbnailKey,
      categoryId: record.categoryId,
      categoryName: record.categoryName,
      categorySlug: record.categorySlug,
      nextAction: isFree ? 'RESUME' : 'PAY',
      hasLearningAccess: isFree,
    };
    store = [enrollment, ...store];
    return delay({ created: true, enrollment });
  },
};
