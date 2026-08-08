export const REPORT_TYPES = [
  'USER_REGISTRATIONS',
  'USER_ACCOUNT_STATUS',
  'COURSE_ENROLLMENTS',
  'COURSE_PARTICIPATION',
  'LEARNING_PROGRESS',
  'COURSE_COMPLETIONS',
  'PAYMENTS',
  'REVENUE',
  'PAYMENT_REVIEW_PERFORMANCE',
  'CERTIFICATES',
  'CERTIFICATE_GENERATION',
  'ADMINISTRATOR_ACTIVITY',
  'AUTHENTICATION_SECURITY_EVENTS',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportFormat = 'CSV' | 'XLSX' | 'PDF';
export type ReportExportStatus =
  'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export const REPORT_LABELS: Record<ReportType, string> = {
  USER_REGISTRATIONS: 'User Registrations',
  USER_ACCOUNT_STATUS: 'User Account Status',
  COURSE_ENROLLMENTS: 'Course Enrollments',
  COURSE_PARTICIPATION: 'Course Participation',
  LEARNING_PROGRESS: 'Learning Progress',
  COURSE_COMPLETIONS: 'Course Completions',
  PAYMENTS: 'Payments',
  REVENUE: 'Revenue',
  PAYMENT_REVIEW_PERFORMANCE: 'Payment Review Performance',
  CERTIFICATES: 'Certificates',
  CERTIFICATE_GENERATION: 'Certificate Generation',
  ADMINISTRATOR_ACTIVITY: 'Administrator Activity',
  AUTHENTICATION_SECURITY_EVENTS: 'Authentication & Security Events',
};

export const REPORT_GROUPS: { label: string; types: ReportType[] }[] = [
  { label: 'User Reports', types: ['USER_REGISTRATIONS', 'USER_ACCOUNT_STATUS'] },
  {
    label: 'Course & Learning Reports',
    types: [
      'COURSE_ENROLLMENTS',
      'COURSE_PARTICIPATION',
      'LEARNING_PROGRESS',
      'COURSE_COMPLETIONS',
    ],
  },
  {
    label: 'Payment & Revenue Reports',
    types: ['PAYMENTS', 'REVENUE', 'PAYMENT_REVIEW_PERFORMANCE'],
  },
  { label: 'Certificate Reports', types: ['CERTIFICATES', 'CERTIFICATE_GENERATION'] },
  {
    label: 'Activity & Security Reports',
    types: ['ADMINISTRATOR_ACTIVITY', 'AUTHENTICATION_SECURITY_EVENTS'],
  },
];

export interface ReportQueryParams {
  from?: string;
  to?: string;
  status?: string;
  courseId?: string;
  studentId?: string;
  categoryId?: string;
  actorId?: string;
  search?: string;
  groupBy?: 'day' | 'week' | 'month';
  page?: number;
  pageSize?: number;
  sortDirection?: 'asc' | 'desc';
}

export interface ReportResult {
  summary: Record<string, unknown> | null;
  rows: Record<string, unknown>[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    filters: ReportQueryParams;
    generatedAt: string;
    timezone: string;
  };
}

export interface CreateReportExportInput {
  reportType: ReportType;
  format: ReportFormat;
  filters?: Record<string, unknown>;
}

export interface ReportExport {
  id: string;
  requestedBy: string;
  reportType: string;
  format: ReportFormat;
  status: ReportExportStatus;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  rowCount: number | null;
  originalFileName: string | null;
  fileSize: number | null;
  failureMessage: string | null;
  downloadAvailable: boolean;
}

export interface ReportExportListResult {
  rows: ReportExport[];
  meta: { page: number; pageSize: number; total: number };
}

export interface ReportExportListParams {
  page?: number;
  pageSize?: number;
  reportType?: string;
  format?: string;
  status?: string;
}

export interface ReportExportDownload {
  url: string;
  expiresInSeconds: number;
  fileName: string | null;
}
