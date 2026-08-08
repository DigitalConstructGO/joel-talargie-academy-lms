import { MOCK_REPORT_EXPORTS, mockReportRows, mockReportSummary } from './mock-reports.data';
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

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

const exportStore: ReportExport[] = MOCK_REPORT_EXPORTS.map((entry) => ({ ...entry }));

export const mockReportsApi = {
  get: async (type: ReportType, params: ReportQueryParams = {}): Promise<ReportResult> => {
    const rows = mockReportRows(type);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    return delay({
      summary: mockReportSummary(type),
      rows,
      meta: {
        page,
        pageSize,
        total: rows.length,
        filters: params,
        generatedAt: new Date().toISOString(),
        timezone: 'UTC',
      },
    });
  },

  createExport: async (input: CreateReportExportInput): Promise<ReportExport> => {
    const report: ReportExport = {
      id: `export-${Date.now()}`,
      requestedBy: 'user-5',
      reportType: input.reportType,
      format: input.format,
      status: 'QUEUED',
      requestedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      cancelledAt: null,
      expiresAt: null,
      rowCount: null,
      originalFileName: null,
      fileSize: null,
      failureMessage: null,
      downloadAvailable: false,
    };
    exportStore.unshift(report);
    setTimeout(() => {
      report.status = 'COMPLETED';
      report.completedAt = new Date().toISOString();
      report.rowCount = mockReportRows(input.reportType).length;
      report.originalFileName = `${input.reportType.toLowerCase()}.${input.format.toLowerCase()}`;
      report.fileSize = 1024;
      report.downloadAvailable = true;
    }, 2000);
    return delay(report);
  },

  listExports: async (params: ReportExportListParams = {}): Promise<ReportExportListResult> => {
    const filtered = exportStore.filter((entry) => {
      if (params.reportType && entry.reportType !== params.reportType) return false;
      if (params.format && entry.format !== params.format) return false;
      if (params.status && entry.status !== params.status) return false;
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({
      rows: filtered.slice(start, start + pageSize),
      meta: { page, pageSize, total: filtered.length },
    });
  },

  exportDetail: async (exportId: string): Promise<ReportExport> => {
    const entry = exportStore.find((row) => row.id === exportId);
    if (!entry) notFound('Report export not found');
    return delay(entry);
  },

  download: async (exportId: string): Promise<ReportExportDownload> => {
    const entry = exportStore.find((row) => row.id === exportId);
    if (!entry || !entry.downloadAvailable) notFound('Export is not available');
    return delay({
      url: '/images/hero/network-abstract.jpg',
      expiresInSeconds: 300,
      fileName: entry.originalFileName,
    });
  },

  retryExport: async (exportId: string, _reason: string): Promise<ReportExport> => {
    const entry = exportStore.find((row) => row.id === exportId);
    if (!entry) notFound('Report export not found');
    entry.status = 'QUEUED';
    return delay(entry);
  },

  cancelExport: async (exportId: string, _reason: string): Promise<ReportExport> => {
    const entry = exportStore.find((row) => row.id === exportId);
    if (!entry) notFound('Report export not found');
    entry.status = 'CANCELLED';
    entry.cancelledAt = new Date().toISOString();
    return delay(entry);
  },
};
