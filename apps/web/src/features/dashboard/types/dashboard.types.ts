export interface DashboardRange {
  preset: string;
  from: string;
  to: string;
  timezone: string;
  previous?: { from: string; to: string } | null;
}

/** Mirrors `DashboardService.comparison()` in `apps/api/src/modules/dashboard/services/dashboard.service.ts`. */
export interface DashboardComparison {
  current: number;
  previous: number | null;
  change: number | null;
  changePercentage: string | null;
  direction: 'UP' | 'DOWN' | 'FLAT' | 'NOT_AVAILABLE';
}

export interface DashboardKpiComparisons {
  newStudents: DashboardComparison;
  newEnrollments: DashboardComparison;
  /** Only present with `dashboard.read_financial`. */
  revenue?: (DashboardComparison & { currency: string })[];
}

export interface DashboardKpis {
  students: { total: number; active: number; pendingVerification: number; newDuringPeriod: number };
  courses: { total: number; published: number; draft: number };
  enrollments: {
    total: number;
    active: number;
    pendingPayment: number;
    completed: number;
    newDuringPeriod: number;
  };
  payments: { waitingForReview: number };
  certificates: { generated: number; attention: number };
  revenue?: { currency: string; amount: string }[];
  /** Only present when the resolved range has a previous-period window (`DashboardQueryDto.comparison`, default true). */
  comparisons?: DashboardKpiComparisons;
}

export interface TrendPoint {
  period: string;
  count: number;
  currency?: string;
  amount?: string;
}

export interface PendingPaymentPreview {
  paymentId: string;
  enrollmentId: string;
  student: { id: string; name: string };
  course: { id: string; title: string };
  currency: string;
  amountMismatch: boolean;
  duplicateTransactionWarning: boolean;
  submittedAt: string;
  waitingSeconds: number;
  submittedAmount?: string;
  expectedAmount?: string;
}

export interface RecentStudentPreview {
  id: string;
  name: string;
  email: string;
  status: string;
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface RecentEnrollmentPreview {
  id: string;
  status: string;
  progress_percentage: number;
  created_at: string;
  course_title: string;
}

export interface RecentCertificatePreview {
  id: string;
  certificate_number: string;
  student_name_at_issue: string;
  course_title_at_issue: string;
  status: string;
  issued_at: string | null;
  generated_at: string | null;
}

export interface TopCoursePerformance {
  id: string;
  title: string;
  status: string;
  access_type: string;
  total_enrollments: number;
  new_enrollments: number;
  completed_enrollments: number;
  average_progress: string | null;
  completion_rate: string | null;
  revenue?: string;
}

export interface RecentActivityPreview {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface OperationalAlert {
  code: string;
  severity: string;
  count: number;
  message: string;
  actionUrl: string;
}

export interface DashboardOverview {
  range: DashboardRange;
  kpis: DashboardKpis;
  trends: {
    registrations: TrendPoint[];
    enrollments: TrendPoint[];
    payments: TrendPoint[];
    completions: TrendPoint[];
  };
  previews: {
    pendingPayments: PendingPaymentPreview[];
    recentStudents: RecentStudentPreview[];
    recentEnrollments: RecentEnrollmentPreview[];
    recentCertificates: RecentCertificatePreview[];
  };
  topCourses: TopCoursePerformance[];
  recentActivity?: RecentActivityPreview[];
  operationalAlerts?: OperationalAlert[];
}

export type DashboardRangePreset =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface DashboardOverviewParams {
  range?: DashboardRangePreset;
  /** ISO8601 date - required when `range` is `'CUSTOM'`. */
  from?: string;
  /** ISO8601 date - required when `range` is `'CUSTOM'`. */
  to?: string;
  previewLimit?: number;
}

export type DashboardTrendKind =
  'registrations' | 'enrollments' | 'payments' | 'revenue' | 'completions' | 'certificates';

export type DashboardGranularity = 'DAY' | 'WEEK' | 'MONTH';

export interface DashboardTrendParams {
  range?: DashboardRangePreset;
  from?: string;
  to?: string;
  granularity?: DashboardGranularity;
}

export interface DashboardTrendResult {
  range: DashboardRange;
  granularity: string;
  points: TrendPoint[];
}

export interface DashboardDistribution {
  range: DashboardRange;
  freeCount: number;
  paidCount: number;
  freePercentage: string | null;
  paidPercentage: string | null;
}

export type CoursePerformanceSort =
  'ENROLLMENTS' | 'COMPLETIONS' | 'COMPLETION_RATE' | 'AVERAGE_PROGRESS' | 'REVENUE';

export interface CoursePerformanceParams {
  range?: DashboardRangePreset;
  from?: string;
  to?: string;
  limit?: number;
  sort?: CoursePerformanceSort;
}

export interface LowCompletionCourse {
  id: string;
  title: string;
  relevant_enrollments: number;
  completed_enrollments: number;
  completion_rate: string | null;
  average_progress: string | null;
}
