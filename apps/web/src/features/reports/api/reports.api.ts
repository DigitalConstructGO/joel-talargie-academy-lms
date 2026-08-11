import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockReportsApi } from '../data/mock-reports.api';
import type {
  CreateReportExportInput,
  ReportExport,
  ReportExportDownload,
  ReportExportListParams,
  ReportExportListResult,
  ReportQueryParams,
  ReportResult,
  ReportType,
} from '../types/report.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const REPORT_ENDPOINTS: Record<ReportType, string> = {
  USER_REGISTRATIONS: 'registrations',
  USER_ACCOUNT_STATUS: 'user-statuses',
  COURSE_ENROLLMENTS: 'enrollments',
  COURSE_PARTICIPATION: 'course-participation',
  LEARNING_PROGRESS: 'learning-progress',
  COURSE_COMPLETIONS: 'course-completions',
  PAYMENTS: 'payments',
  REVENUE: 'revenue',
  PAYMENT_REVIEW_PERFORMANCE: 'payment-review-performance',
  CERTIFICATES: 'certificates',
  CERTIFICATE_GENERATION: 'certificate-generation',
  ADMINISTRATOR_ACTIVITY: 'administrator-activity',
  AUTHENTICATION_SECURITY_EVENTS: 'security-events',
};

const liveReportsApi = {
  get: async (type: ReportType, params: ReportQueryParams = {}) =>
    unwrap<ReportResult>(
      await authClient.get(`/admin/reports/${REPORT_ENDPOINTS[type]}`, {
        params: cleanParams(params),
      }),
    ),

  createExport: async (input: CreateReportExportInput) =>
    unwrap<ReportExport>(await authClient.post('/admin/report-exports', input)),

  listExports: async (params: ReportExportListParams = {}) =>
    unwrap<ReportExportListResult>(
      await authClient.get('/admin/report-exports', { params: cleanParams(params) }),
    ),

  exportDetail: async (exportId: string) =>
    unwrap<ReportExport>(
      await authClient.get(`/admin/report-exports/${encodeURIComponent(exportId)}`),
    ),

  download: async (exportId: string) =>
    unwrap<ReportExportDownload>(
      await authClient.get(`/admin/report-exports/${encodeURIComponent(exportId)}/download`),
    ),

  retryExport: async (exportId: string, reason: string) =>
    unwrap<ReportExport>(
      await authClient.post(`/admin/report-exports/${encodeURIComponent(exportId)}/retry`, {
        reason,
      }),
    ),

  cancelExport: async (exportId: string, reason: string) =>
    unwrap<ReportExport>(
      await authClient.post(`/admin/report-exports/${encodeURIComponent(exportId)}/cancel`, {
        reason,
      }),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const reportsApi = CATALOG_DATA_SOURCE === 'live' ? liveReportsApi : mockReportsApi;
