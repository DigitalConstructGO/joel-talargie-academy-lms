'use client';

import { useQuery } from '@tanstack/react-query';
import { staffDashboardApi } from '../api/staff-course-dashboard.api';
import type {
  StaffCoursePerformanceParams,
  StaffDashboardParams,
  StaffDashboardTrendParams,
} from '../types/staff-course-dashboard.types';

export function useStaffDashboardOverview(
  params: StaffDashboardParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['staff-dashboard-overview', params] as const,
    queryFn: () => staffDashboardApi.overview(params),
    enabled: options.enabled,
  });
}

export function useStaffDashboardKpis(
  params: StaffDashboardParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['staff-dashboard-kpis', params] as const,
    queryFn: () => staffDashboardApi.kpis(params),
    enabled: options.enabled,
  });
}

export function useStaffEnrollmentTrend(
  params: StaffDashboardTrendParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['staff-dashboard-enrollment-trend', params] as const,
    queryFn: () => staffDashboardApi.enrollmentTrend(params),
    enabled: options.enabled,
  });
}

export function useStaffCompletionTrend(
  params: StaffDashboardTrendParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['staff-dashboard-completion-trend', params] as const,
    queryFn: () => staffDashboardApi.completionTrend(params),
    enabled: options.enabled,
  });
}

export function useStaffCoursePerformance(
  params: StaffCoursePerformanceParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['staff-dashboard-course-performance', params] as const,
    queryFn: () => staffDashboardApi.coursePerformance(params),
    enabled: options.enabled,
  });
}

export function useStaffRecentEnrollments(
  params: { limit?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['staff-dashboard-recent-enrollments', params] as const,
    queryFn: () => staffDashboardApi.recentEnrollments(params),
    enabled: options.enabled,
  });
}

export function useStaffRecentCompletions(
  params: { limit?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['staff-dashboard-recent-completions', params] as const,
    queryFn: () => staffDashboardApi.recentCompletions(params),
    enabled: options.enabled,
  });
}
