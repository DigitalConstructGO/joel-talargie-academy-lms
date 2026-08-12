/**
 * Staff Course Dashboard API client.
 *
 * All endpoints are prefixed with /staff/dashboard/.
 * The backend enforces ownership scoping via courses.created_by = userId (from JWT).
 */
import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  StaffCoursePerformanceParams,
  StaffCoursePerformanceRow,
  StaffDashboardOverview,
  StaffDashboardParams,
  StaffDashboardTrendParams,
  StaffKpisResponse,
  StaffRecentCompletion,
  StaffRecentEnrollment,
  StaffTrendResponse,
} from '../types/staff-course-dashboard.types';

export const staffDashboardApi = {
  overview: async (params: StaffDashboardParams = {}) =>
    unwrap<StaffDashboardOverview>(await authClient.get('/staff/dashboard/overview', { params })),

  kpis: async (params: StaffDashboardParams = {}) =>
    unwrap<StaffKpisResponse>(await authClient.get('/staff/dashboard/kpis', { params })),

  enrollmentTrend: async (params: StaffDashboardTrendParams = {}) =>
    unwrap<StaffTrendResponse>(
      await authClient.get('/staff/dashboard/trends/enrollments', { params }),
    ),

  completionTrend: async (params: StaffDashboardTrendParams = {}) =>
    unwrap<StaffTrendResponse>(
      await authClient.get('/staff/dashboard/trends/completions', { params }),
    ),

  coursePerformance: async (params: StaffCoursePerformanceParams = {}) =>
    unwrap<StaffCoursePerformanceRow[]>(
      await authClient.get('/staff/dashboard/course-performance', { params }),
    ),

  recentEnrollments: async (params: { limit?: number } = {}) =>
    unwrap<StaffRecentEnrollment[]>(
      await authClient.get('/staff/dashboard/recent-enrollments', { params }),
    ),

  recentCompletions: async (params: { limit?: number } = {}) =>
    unwrap<StaffRecentCompletion[]>(
      await authClient.get('/staff/dashboard/recent-completions', { params }),
    ),
};
