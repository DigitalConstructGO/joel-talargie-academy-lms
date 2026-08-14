export type EnrollmentStatus =
  | 'PENDING_PAYMENT'
  | 'WAITING_APPROVAL'
  | 'ENROLLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ACCESS_REVOKED';

export interface Enrollment {
  id: string;
  courseId: string;
  status: EnrollmentStatus;
  priceSnapshot: string;
  discountSnapshot: string | null;
  currencySnapshot: string;
  progressPercentage: number;
  enrolledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  courseTitle: string;
  courseSlug: string;
  thumbnailKey: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  /** Server-computed next step (e.g. `'RESUME'`, `'PAY'`) - see the backend's `enrollmentNextAction`. */
  nextAction: string;
  hasLearningAccess: boolean;
}

export interface EnrollmentListResult {
  items: Enrollment[];
  total: number;
}

export interface EnrollmentListParams {
  page?: number;
  pageSize?: number;
  status?: EnrollmentStatus;
  /** Restrict results to these statuses (e.g. only learning-status enrollments for "My Courses"). */
  enrollmentStatuses?: EnrollmentStatus[];
  search?: string;
  categoryId?: string;
}

export interface EnrollmentCreateResult {
  created: boolean;
  enrollment: Enrollment;
}
