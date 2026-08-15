'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import type {
  CoursePerformanceParams,
  DashboardOverviewParams,
  DashboardTrendKind,
  DashboardTrendParams,
} from '../types/dashboard.types';

export function useDashboardOverview(
  params: DashboardOverviewParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['admin-dashboard-overview', params] as const,
    queryFn: () => dashboardApi.overview(params),
    enabled: options.enabled,
  });
}

export function useDashboardFilterOptions(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-filter-options'] as const,
    queryFn: () => dashboardApi.filterOptions(),
    enabled: options.enabled,
  });
}

export function useDashboardTrend(
  kind: DashboardTrendKind,
  params: DashboardTrendParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['admin-dashboard-trend', kind, params] as const,
    queryFn: () => dashboardApi.trend(kind, params),
    enabled: options.enabled,
  });
}

export function useDashboardDistribution(
  params: DashboardOverviewParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['admin-dashboard-distribution', params] as const,
    queryFn: () => dashboardApi.distribution(params),
    enabled: options.enabled,
  });
}

export function useCoursePerformance(
  params: CoursePerformanceParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['admin-dashboard-course-performance', params] as const,
    queryFn: () => dashboardApi.coursePerformance(params),
    enabled: options.enabled,
  });
}

export function useLowCompletionCourses(
  params: CoursePerformanceParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['admin-dashboard-low-completion', params] as const,
    queryFn: () => dashboardApi.lowCompletionCourses(params),
    enabled: options.enabled,
  });
}
