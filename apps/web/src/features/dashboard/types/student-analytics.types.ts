/**
 * Student Analytics types.
 *
 * Mirrors the shapes returned by StudentAnalyticsService.
 * All data is scoped to the authenticated student's own records.
 */

import type { DashboardRange, DashboardGranularity, TrendPoint } from './dashboard.types';

export type { DashboardRange, DashboardGranularity, TrendPoint };

export type StudentAnalyticsRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface StudentAnalyticsParams {
  range?: StudentAnalyticsRangePreset;
  from?: string;
  to?: string;
  previewLimit?: number;
}

export interface StudentAnalyticsTrendParams extends StudentAnalyticsParams {
  granularity?: DashboardGranularity;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export interface StudentAnalyticsKpis {
  totalEnrolled: number;
  inProgress: number;
  completed: number;
  certificatesEarned: number;
  /** Numeric string 0-100; null when no enrollments exist. */
  averageProgress: string | null;
  newEnrollmentsDuringPeriod: number;
  completionsDuringPeriod: number;
  /** Total accumulated learning time in seconds across all lessons. */
  totalLearningSeconds: number;
}

export interface StudentKpisResponse {
  range: DashboardRange;
  kpis: StudentAnalyticsKpis;
}

// ─── Enrollment progress ──────────────────────────────────────────────────────

export interface StudentEnrollmentProgress {
  enrollment_id: string;
  status: string;
  progress_percentage: number;
  enrolled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  course_id: string;
  course_title: string;
  access_type: string;
  category_name: string | null;
  certificate_status: string | null;
  certificate_number: string | null;
}

// ─── Payment history ──────────────────────────────────────────────────────────

export interface StudentPaymentHistoryItem {
  id: string;
  status: string;
  amount: string;
  currency: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  course_title: string;
  enrollment_status: string;
}

export interface StudentPaymentHistoryResponse {
  range: DashboardRange;
  payments: StudentPaymentHistoryItem[];
}

// ─── Trend ────────────────────────────────────────────────────────────────────

export interface StudentTrendResponse {
  range: DashboardRange;
  granularity: string;
  points: TrendPoint[];
}

// ─── Overview response ────────────────────────────────────────────────────────

export interface StudentAnalyticsOverview extends StudentKpisResponse {
  enrollments: StudentEnrollmentProgress[];
  trends: {
    learningActivity: TrendPoint[];
    enrollments: TrendPoint[];
  };
}
