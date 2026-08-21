import type { ReportExport, ReportType } from '../types/report.types';

const SAMPLE_ROWS: Partial<Record<ReportType, Record<string, unknown>[]>> = {
  USER_REGISTRATIONS: [
    {
      email: 'ab***@example.com',
      fullName: 'Abebe Kebede',
      provider: 'LOCAL',
      createdAt: '2026-06-01T09:00:00.000Z',
    },
    {
      email: 'sa***@example.com',
      fullName: 'Sara Tesfaye',
      provider: 'GOOGLE',
      createdAt: '2026-06-05T09:00:00.000Z',
    },
  ],
  REVENUE: [
    { currency: 'ETB', totalRevenue: '1249.50', paymentCount: 32, period: '2026-06' },
    { currency: 'ETB', totalRevenue: '84200.00', paymentCount: 51, period: '2026-06' },
  ],
  COURSE_ENROLLMENTS: [
    {
      courseTitle: 'Modern React Development',
      studentEmail: 'ab***@example.com',
      status: 'IN_PROGRESS',
      enrolledAt: '2026-02-01T09:00:00.000Z',
    },
  ],
  CERTIFICATES: [
    {
      courseTitle: 'Modern React Development',
      studentEmail: 'sa***@example.com',
      status: 'GENERATED',
      issuedAt: '2026-03-01T09:00:00.000Z',
    },
  ],
  ADMINISTRATOR_ACTIVITY: [
    {
      actorEmail: 'admin@joeltalargieacademy.com',
      action: 'admin.user.suspended',
      entityType: 'user',
      createdAt: '2026-08-01T09:00:00.000Z',
    },
    {
      actorEmail: 'admin@joeltalargieacademy.com',
      action: 'course.published',
      entityType: 'course',
      createdAt: '2026-08-02T10:00:00.000Z',
    },
  ],
};

const SAMPLE_SUMMARY: Partial<Record<ReportType, Record<string, unknown>>> = {
  REVENUE: { totalRevenueUsd: '1249.50', totalPayments: 32 },
  COURSE_ENROLLMENTS: { totalEnrollments: 128, completedCount: 41 },
};

export function mockReportRows(type: ReportType): Record<string, unknown>[] {
  return SAMPLE_ROWS[type] ?? [];
}

export function mockReportSummary(type: ReportType): Record<string, unknown> | null {
  return SAMPLE_SUMMARY[type] ?? null;
}

export const MOCK_REPORT_EXPORTS: ReportExport[] = [
  {
    id: 'export-1',
    requestedBy: 'user-5',
    reportType: 'REVENUE',
    format: 'CSV',
    status: 'COMPLETED',
    requestedAt: '2026-08-01T09:00:00.000Z',
    startedAt: '2026-08-01T09:00:05.000Z',
    completedAt: '2026-08-01T09:00:20.000Z',
    failedAt: null,
    cancelledAt: null,
    expiresAt: '2026-08-08T09:00:20.000Z',
    rowCount: 2,
    originalFileName: 'revenue-report.csv',
    fileSize: 1820,
    failureMessage: null,
    downloadAvailable: true,
  },
];
