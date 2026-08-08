import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import {
  MOCK_DASHBOARD_OVERVIEW,
  MOCK_DASHBOARD_TRENDS,
  MOCK_DISTRIBUTION,
  MOCK_LOW_COMPLETION_COURSES,
} from '../data/mock-dashboard.data';
import type {
  CoursePerformanceParams,
  DashboardDistribution,
  DashboardOverview,
  DashboardOverviewParams,
  DashboardTrendKind,
  DashboardTrendParams,
  DashboardTrendResult,
  LowCompletionCourse,
  TopCoursePerformance,
} from '../types/dashboard.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const liveDashboardApi = {
  overview: async (params: DashboardOverviewParams = {}) =>
    unwrap<DashboardOverview>(await authClient.get('/admin/dashboard/overview', { params })),

  trend: async (kind: DashboardTrendKind, params: DashboardTrendParams = {}) =>
    unwrap<DashboardTrendResult>(
      await authClient.get(`/admin/dashboard/trends/${kind}`, { params }),
    ),

  distribution: async (params: DashboardOverviewParams = {}) =>
    unwrap<DashboardDistribution>(
      await authClient.get('/admin/dashboard/enrollment-distribution', { params }),
    ),

  coursePerformance: async (params: CoursePerformanceParams = {}) =>
    unwrap<TopCoursePerformance[]>(
      await authClient.get('/admin/dashboard/course-performance', { params }),
    ),

  lowCompletionCourses: async (params: CoursePerformanceParams = {}) =>
    unwrap<LowCompletionCourse[]>(
      await authClient.get('/admin/dashboard/courses/low-completion', { params }),
    ),
};

const mockDashboardApi = {
  overview: async (_params: DashboardOverviewParams = {}) => delay(MOCK_DASHBOARD_OVERVIEW),

  trend: async (kind: DashboardTrendKind, _params: DashboardTrendParams = {}) =>
    delay(MOCK_DASHBOARD_TRENDS[kind]),

  distribution: async (_params: DashboardOverviewParams = {}) => delay(MOCK_DISTRIBUTION),

  coursePerformance: async (_params: CoursePerformanceParams = {}) =>
    delay(MOCK_DASHBOARD_OVERVIEW.topCourses),

  lowCompletionCourses: async (_params: CoursePerformanceParams = {}) =>
    delay(MOCK_LOW_COMPLETION_COURSES),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const dashboardApi = CATALOG_DATA_SOURCE === 'live' ? liveDashboardApi : mockDashboardApi;
