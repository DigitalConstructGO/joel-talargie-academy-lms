import type { EnrollmentListParams } from '../types/enrollment.types';

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: (params: EnrollmentListParams) => [...enrollmentKeys.lists(), params] as const,
  byCourse: (courseId: string) => [...enrollmentKeys.all, 'by-course', courseId] as const,
};
