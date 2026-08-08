'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Download, FileText, Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { DateRangeFilter } from '@/components/dashboard/filters/date-range-filter';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/can';
import { ReportTable } from '@/features/reports/components/report-table';
import {
  useCreateReportExport,
  useDownloadReportExport,
  useReport,
  useReportExports,
} from '@/features/reports/hooks/use-reports';
import {
  REPORT_GROUPS,
  type ReportExportStatus,
  type ReportFormat,
  type ReportType,
} from '@/features/reports/types/report.types';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 25;

interface ReportsFilters {
  [key: string]: string | undefined;
  type: ReportType;
  search: string | undefined;
  from: string | undefined;
  to: string | undefined;
}

const DEFAULT_FILTERS: ReportsFilters = {
  type: 'USER_REGISTRATIONS',
  search: undefined,
  from: undefined,
  to: undefined,
};

const EXPORT_STATUS_VARIANT: Record<ReportExportStatus, NonNullable<BadgeProps['variant']>> = {
  QUEUED: 'secondary',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'outline',
  EXPIRED: 'outline',
};

function ExportDialog({ reportType }: { reportType: ReportType }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ReportFormat>('CSV');
  const createExport = useCreateReportExport();

  async function handleSubmit() {
    try {
      await createExport.mutateAsync({ reportType, format });
      toast.success('Export queued', 'Check the exports list below once it finishes.');
      setOpen(false);
    } catch {
      toast.error('Could not queue this export');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Can permission="reports.export">
        <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <Download className="size-4" /> Export
        </Button>
      </Can>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export report</DialogTitle>
        </DialogHeader>
        <Select value={format} onValueChange={(value) => setFormat(value as ReportFormat)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CSV">CSV</SelectItem>
            <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createExport.isPending}>
            {createExport.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Queue export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExportsList() {
  const exportsQuery = useReportExports({ pageSize: 5 });
  const download = useDownloadReportExport();

  async function handleDownload(exportId: string) {
    try {
      const result = await download.mutateAsync(exportId);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('This export is not ready yet');
    }
  }

  if (exportsQuery.isLoading) return <Skeleton className="h-24 w-full" />;
  const exports = exportsQuery.data?.rows ?? [];
  if (exports.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm font-semibold text-foreground">Recent exports</p>
        {exports.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <span>{entry.originalFileName ?? `${entry.reportType} (${entry.format})`}</span>
              <Badge variant={EXPORT_STATUS_VARIANT[entry.status]}>{entry.status}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDateTime(entry.requestedAt)}</span>
              {entry.downloadAvailable && (
                <Can permission="reports.download_exports">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1"
                    onClick={() => handleDownload(entry.id)}
                    disabled={download.isPending}
                  >
                    <Download className="size-3.5" /> Download
                  </Button>
                </Can>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const { filters, page, pageSize, setFilter, setFilters, setPage } =
    useQueryFilters<ReportsFilters>({
      defaults: DEFAULT_FILTERS,
      pageSize: PAGE_SIZE,
    });
  const { type, search, from, to } = filters;

  const reportQuery = useReport(type, {
    page,
    pageSize,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const dateRange: DateRange | undefined =
    from || to
      ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined }
      : undefined;

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Reports & Analytics' },
          { label: 'Reports' },
        ]}
      />
      <PageHeader
        title="Reports"
        description="Generate and export platform reports."
        actions={<ExportDialog reportType={type} />}
      />

      <FilterBar>
        <Select value={type} onValueChange={(value) => setFilter('type', value as ReportType)}>
          <SelectTrigger className="w-full sm:w-72" aria-label="Report type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </p>
                {group.types.map((reportType) => (
                  <SelectItem key={reportType} value={reportType}>
                    {reportType.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <SearchBar
          placeholder="Search..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <DateRangeFilter
          value={dateRange}
          onChange={(range) =>
            setFilters({
              from: range?.from ? range.from.toISOString().slice(0, 10) : undefined,
              to: range?.to ? range.to.toISOString().slice(0, 10) : undefined,
            })
          }
        />
      </FilterBar>

      <ExportsList />

      <ReportTable
        result={reportQuery.data}
        isLoading={reportQuery.isLoading}
        isFetching={reportQuery.isFetching}
        isError={reportQuery.isError}
        onRetry={() => reportQuery.refetch()}
        page={page}
        onPageChange={setPage}
      />
    </ContentContainer>
  );
}
