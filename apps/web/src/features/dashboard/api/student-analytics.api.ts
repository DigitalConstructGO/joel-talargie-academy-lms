/**
 * Student Analytics API client.
 *
 * All endpoints are prefixed with /student/analytics/.
 * The backend enforces isolation via enrollments.student_id = userId (from JWT).
 */
import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  StudentAnalyticsOverview,
  StudentAnalyticsParams,
  StudentAnalyticsTrendParams,
  StudentEnrollmentProgress,
  StudentKpisResponse,
  StudentPaymentHistoryResponse,
  StudentTrendResponse,
} from '../types/student-analytics.types';

export const studentAnalyticsApi = {
  overview: async (params: StudentAnalyticsParams = {}) =>
    unwrap<StudentAnalyticsOverview>(
      await authClient.get('/student/analytics/overview', { params }),
    ),

  kpis: async (params: StudentAnalyticsParams = {}) =>
    unwrap<StudentKpisResponse>(await authClient.get('/student/analytics/kpis', { params })),

  progress: async () =>
    unwrap<StudentEnrollmentProgress[]>(await authClient.get('/student/analytics/progress')),

  learningActivityTrend: async (params: StudentAnalyticsTrendParams = {}) =>
    unwrap<StudentTrendResponse>(
      await authClient.get('/student/analytics/trends/learning-activity', { params }),
    ),

  enrollmentTrend: async (params: StudentAnalyticsTrendParams = {}) =>
    unwrap<StudentTrendResponse>(
      await authClient.get('/student/analytics/trends/enrollments', { params }),
    ),

  payments: async (params: StudentAnalyticsParams = {}) =>
    unwrap<StudentPaymentHistoryResponse>(
      await authClient.get('/student/analytics/payments', { params }),
    ),
};
