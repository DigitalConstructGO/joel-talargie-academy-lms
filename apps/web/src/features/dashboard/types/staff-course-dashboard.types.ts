/**
 * Staff Course Dashboard types.
 *
 * These mirror the shapes returned by StaffCourseDashboardService.
 * "Staff" here is role-agnostic — any user who has `courses.read` and
 * `dashboard.read` permissions and owns at least one course will see this
 * data, regardless of what their role is called.
 */

import type { DashboardRange, DashboardGranularity, TrendPoint } from './dashboard.types';

// ─── Re-export shared presets/params from main types ─────────────────────────

export type { DashboardRange, DashboardGranularity, TrendPoint };

export type StaffDashboardRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface StaffDashboardParams {
  range?: StaffDashboardRangePreset;
  from?: string;
  to?: string;
  previewLimit?: number;
}

export interface StaffDashboardTrendParams extends StaffDashboardParams {
  granularity?: DashboardGranularity;
}

export type StaffCoursePerformanceSort =
  'ENROLLMENTS' | 'COMPLETIONS' | 'COMPLETION_RATE' | 'AVERAGE_PROGRESS' | 'REVENUE';

export interface StaffCoursePerformanceParams extends StaffDashboardParams {
  sort?: StaffCoursePerformanceSort;
  limit?: number;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export interface StaffCourseKpis {
  myCourses: {
    total: number;
    published: number;
    draft: number;
  };
  myStudents: {
    total: number;
    activeEnrollments: number;
    completedEnrollments: number;
    newEnrollmentsDuringPeriod: number;
  };
  /** Numeric string 0-100; null when no enrollments exist. */
  myCompletionRate: string | null;
  myCertificatesIssued: number;
  /** Present only if the user has `dashboard.read_financial`. */
  myRevenue?: { currency: string; amount: string }[];
}

export interface StaffKpisResponse {
  range: DashboardRange;
  kpis: StaffCourseKpis;
}

// ─── Course performance table ─────────────────────────────────────────────────

export interface StaffCoursePerformanceRow {
  id: string;
  title: string;
  status: string;
  access_type: string;
  total_enrollments: number;
  new_enrollments: number;
  completed_enrollments: number;
  average_progress: string | null;
  completion_rate: string | null;
  /** Present only if the user has `dashboard.read_financial`. */
  revenue?: string;
}

// ─── Recent activity rows ─────────────────────────────────────────────────────

export interface StaffRecentEnrollment {
  id: string;
  status: string;
  progress_percentage: number;
  created_at: string;
  enrolled_at: string | null;
  completed_at: string | null;
  course_id: string;
  course_title: string;
  first_name: string | null;
  last_name: string | null;
}

export interface StaffRecentCompletion {
  enrollment_id: string;
  started_at: string | null;
  completed_at: string | null;
  course_title: string;
  first_name: string | null;
  last_name: string | null;
  certificate_status: string | null;
  certificate_number: string | null;
}

// ─── Overview response ────────────────────────────────────────────────────────

export interface StaffDashboardOverview extends StaffKpisResponse {
  recentEnrollments: StaffRecentEnrollment[];
  recentCompletions: StaffRecentCompletion[];
  topCourses: StaffCoursePerformanceRow[];
}

// ─── Trend ────────────────────────────────────────────────────────────────────

export interface StaffTrendResponse {
  range: DashboardRange;
  granularity: string;
  points: TrendPoint[];
}
