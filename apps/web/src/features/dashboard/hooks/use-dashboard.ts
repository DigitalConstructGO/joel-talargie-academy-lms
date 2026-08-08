'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import type {
  CoursePerformanceParams,
  DashboardOverviewParams,
  DashboardTrendKind,
  DashboardTrendParams,
} from '../types/dashboard.types';

export function useDashboardOverview(params: DashboardOverviewParams = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-overview', params] as const,
    queryFn: () => dashboardApi.overview(params),
  });
}

export function useDashboardTrend(kind: DashboardTrendKind, params: DashboardTrendParams = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-trend', kind, params] as const,
    queryFn: () => dashboardApi.trend(kind, params),
  });
}

export function useDashboardDistribution(params: DashboardOverviewParams = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-distribution', params] as const,
    queryFn: () => dashboardApi.distribution(params),
  });
}

export function useCoursePerformance(params: CoursePerformanceParams = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-course-performance', params] as const,
    queryFn: () => dashboardApi.coursePerformance(params),
  });
}

export function useLowCompletionCourses(params: CoursePerformanceParams = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-low-completion', params] as const,
    queryFn: () => dashboardApi.lowCompletionCourses(params),
  });
}
