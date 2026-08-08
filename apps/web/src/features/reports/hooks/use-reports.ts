'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';
import type {
  CreateReportExportInput,
  ReportExportListParams,
  ReportQueryParams,
  ReportType,
} from '../types/report.types';

const reportKeys = {
  all: ['reports'] as const,
  report: (type: ReportType, params: ReportQueryParams) =>
    [...reportKeys.all, type, params] as const,
  exports: () => [...reportKeys.all, 'exports'] as const,
  exportList: (params: ReportExportListParams) =>
    [...reportKeys.exports(), 'list', params] as const,
  exportDetail: (exportId: string) => [...reportKeys.exports(), 'detail', exportId] as const,
};

export function useReport(type: ReportType, params: ReportQueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: reportKeys.report(type, params),
    queryFn: () => reportsApi.get(type, params),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useReportExports(params: ReportExportListParams = {}) {
  return useQuery({
    queryKey: reportKeys.exportList(params),
    queryFn: () => reportsApi.listExports(params),
    placeholderData: (previous) => previous,
    refetchInterval: (query) =>
      query.state.data?.rows.some((row) => row.status === 'QUEUED' || row.status === 'PROCESSING')
        ? 3000
        : false,
  });
}

export function useReportExport(exportId: string | undefined) {
  return useQuery({
    queryKey: reportKeys.exportDetail(exportId ?? ''),
    queryFn: () => reportsApi.exportDetail(exportId!),
    enabled: Boolean(exportId),
  });
}

export function useCreateReportExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportExportInput) => reportsApi.createExport(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.exports() });
    },
  });
}

export function useDownloadReportExport() {
  return useMutation({ mutationFn: (exportId: string) => reportsApi.download(exportId) });
}

export function useRetryReportExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exportId, reason }: { exportId: string; reason: string }) =>
      reportsApi.retryExport(exportId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.exports() });
    },
  });
}

export function useCancelReportExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exportId, reason }: { exportId: string; reason: string }) =>
      reportsApi.cancelExport(exportId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.exports() });
    },
  });
}
