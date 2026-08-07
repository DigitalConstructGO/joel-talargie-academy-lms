import type { EnrollmentStatus } from './enrollment.types';

export interface AdminEnrollment {
  id: string;
  studentId: string;
  studentEmail: string;
  firstName: string | null;
  lastName: string | null;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: EnrollmentStatus;
  priceSnapshot: string;
  discountSnapshot: string | null;
  currencySnapshot: string;
  progressPercentage: number;
  enrolledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  accessRevokedAt: string | null;
  accessRevocationReason: string | null;
  createdAt: string;
  updatedAt: string;
  nextAction: string;
  hasLearningAccess: boolean;
}

export interface AdminEnrollmentDetail extends AdminEnrollment {
  paymentAttempts: number;
}

export interface AdminEnrollmentListParams {
  page?: number;
  pageSize?: number;
  status?: EnrollmentStatus;
  search?: string;
  studentId?: string;
  courseId?: string;
  categoryId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface AdminEnrollmentListResult {
  items: AdminEnrollment[];
  total: number;
}

export interface EnrollmentActivityEntry {
  id: string;
  action: string;
  createdAt: string;
}

export interface EnrollmentActivityParams {
  page?: number;
  pageSize?: number;
  action?: string;
  createdFrom?: string;
  createdTo?: string;
}
