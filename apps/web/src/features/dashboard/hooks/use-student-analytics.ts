'use client';

import { useQuery } from '@tanstack/react-query';
import { studentAnalyticsApi } from '../api/student-analytics.api';
import type {
  StudentAnalyticsParams,
  StudentAnalyticsTrendParams,
} from '../types/student-analytics.types';

export function useStudentAnalyticsOverview(
  params: StudentAnalyticsParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['student-analytics-overview', params] as const,
    queryFn: () => studentAnalyticsApi.overview(params),
    enabled: options.enabled,
  });
}

export function useStudentAnalyticsKpis(
  params: StudentAnalyticsParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['student-analytics-kpis', params] as const,
    queryFn: () => studentAnalyticsApi.kpis(params),
    enabled: options.enabled,
  });
}

export function useStudentProgress(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['student-analytics-progress'] as const,
    queryFn: () => studentAnalyticsApi.progress(),
    enabled: options.enabled,
  });
}

export function useStudentLearningActivityTrend(
  params: StudentAnalyticsTrendParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['student-analytics-learning-activity', params] as const,
    queryFn: () => studentAnalyticsApi.learningActivityTrend(params),
    enabled: options.enabled,
  });
}

export function useStudentEnrollmentTrend(
  params: StudentAnalyticsTrendParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['student-analytics-enrollment-trend', params] as const,
    queryFn: () => studentAnalyticsApi.enrollmentTrend(params),
    enabled: options.enabled,
  });
}

export function useStudentPaymentHistory(
  params: StudentAnalyticsParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['student-analytics-payments', params] as const,
    queryFn: () => studentAnalyticsApi.payments(params),
    enabled: options.enabled,
  });
}
