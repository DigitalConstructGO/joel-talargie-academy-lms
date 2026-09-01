'use client';

import type { DateRange } from 'react-day-picker';
import { ChevronDown, Download, FileText, Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { DateRangeFilter } from '@/components/dashboard/filters/date-range-filter';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { reportsApi } from '@/features/reports/api/reports.api';
import {
  REPORT_GROUPS,
  type ReportExportStatus,
  type ReportFormat,
  type ReportType,
} from '@/features/reports/types/report.types';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useAdminCourses } from '@/features/catalog/hooks/use-admin-courses';
import { useAdminCategories } from '@/features/catalog/hooks/use-admin-categories';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 10;

interface ReportsFilters {
  [key: string]: string | undefined;
  type: ReportType;
  search: string | undefined;
  from: string | undefined;
  to: string | undefined;
  status: string | undefined;
  courseId: string | undefined;
  categoryId: string | undefined;
}

const DEFAULT_FILTERS: ReportsFilters = {
  type: 'USER_REGISTRATIONS',
  search: undefined,
  from: undefined,
  to: undefined,
  status: undefined,
  courseId: undefined,
  categoryId: undefined,
};

const EXPORT_STATUS_VARIANT: Record<ReportExportStatus, NonNullable<BadgeProps['variant']>> = {
  QUEUED: 'secondary',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'outline',
  EXPIRED: 'outline',
};

const REPORT_TYPE_LABELS_AM: Record<string, string> = {
  USER_REGISTRATIONS: 'የተጠቃሚዎች ምዝገባ',
  COURSE_ENROLLMENTS: 'የኮርሶች ምዝገባ',
  PAYMENT_TRANSACTIONS: 'የክፍያ እንቅስቃሴዎች',
  STUDENT_PROGRESS: 'የተማሪዎች የትምህርት ሂደት',
  CERTIFICATE_ISSUANCES: 'የተሰጡ ሰርተፊኬቶች',
  MENTOR_PERFORMANCE: 'የአስተማሪዎች አፈፃፀም',
  ACTIVITY_LOGS: 'የሲስተም እንቅስቃሴ መዝገብ',
};

function ExportMenu({
  reportType,
  filters,
}: {
  reportType: ReportType;
  filters: Record<string, unknown>;
}) {
  const { locale } = useLanguage();
  const createExport = useCreateReportExport();

  async function exportReport(format: ReportFormat) {
    try {
      const queued = await createExport.mutateAsync({ reportType, format, filters });
      toast.success('Preparing download…');
      const deadline = Date.now() + 60_000;
      let exportState = queued;
      while (exportState.status === 'QUEUED' || exportState.status === 'PROCESSING') {
        if (Date.now() >= deadline) {
          toast.error(
            'Export is taking longer than expected',
            'It will remain available in Recent downloads.',
          );
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1_000));
        exportState = await reportsApi.exportDetail(queued.id);
      }
      if (!exportState.downloadAvailable) {
        toast.error(exportState.failureMessage ?? 'Could not generate this export');
        return;
      }
      const download = await reportsApi.download(queued.id);
      const link = document.createElement('a');
      link.href = download.url;
      link.download = download.fileName ?? '';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch {
      toast.error('Could not prepare this export');
    }
  }

  return (
    <Can permission="reports.export">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={createExport.isPending}>
            {createExport.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {locale === 'am' ? 'ላክ (Export)' : 'Export'} <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void exportReport('CSV')}>
            {locale === 'am' ? 'በCSV ላክ' : 'Export CSV'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void exportReport('PDF')}>
            {locale === 'am' ? 'በPDF ላክ' : 'Export PDF'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Can>
  );
}

function ExportsList() {
  const { locale } = useLanguage();
  const exportsQuery = useReportExports({ pageSize: 5 });
  const download = useDownloadReportExport();

  async function handleDownload(exportId: string) {
    try {
      const result = await download.mutateAsync(exportId);
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName ?? '';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch {
      toast.error('Unable to download this export', 'Please try again.');
    }
  }

  if (exportsQuery.isLoading) return <Skeleton className="h-24 w-full" />;
  const exports = exportsQuery.data?.rows ?? [];
  if (exports.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm font-semibold text-foreground">
          {locale === 'am' ? 'የቅርብ ጊዜ ኤክስፖርቶች' : 'Recent exports'}
        </p>
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
                    <Download className="size-3.5" />
                    {locale === 'am' ? 'አውርድ' : 'Download'}
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

import {
  useLanguage,
  translateCourseTitle,
  translateCategoryName,
} from '@/lib/i18n/language-provider';
import { usePermissions } from '@/hooks/use-permissions';

export default function AdminReportsPage() {
  const { t, locale } = useLanguage();
  const { canAny, isAdministrator } = usePermissions();

  const visibleGroups = REPORT_GROUPS.filter(
    (group) => isAdministrator || canAny(group.permissions),
  );

  const { filters, page, pageSize, setFilter, setFilters, setPage, setPageSize } =
    useQueryFilters<ReportsFilters>({
      defaults: DEFAULT_FILTERS,
      pageSize: PAGE_SIZE,
    });
  const { type, search, from, to, status, courseId, categoryId } = filters;
  const coursesQuery = useAdminCourses({ pageSize: 100 });
  const categoriesQuery = useAdminCategories({ pageSize: 100 });
  const courseOptions = (coursesQuery.data?.items ?? []).map((course) => ({
    label: translateCourseTitle(course.title, locale),
    value: course.id,
  }));
  const categoryOptions = (categoriesQuery.data?.items ?? []).map((category) => ({
    label: translateCategoryName(category.name, locale),
    value: category.id,
  }));

  const reportQuery = useReport(type, {
    page,
    pageSize,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
    courseId: courseId || undefined,
    categoryId: categoryId || undefined,
  });

  const dateRange: DateRange | undefined =
    from || to
      ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined }
      : undefined;

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: t('sidebar.dashboard'), href: ROUTES.admin.root },
          { label: t('sidebar.reports') },
        ]}
      />
      <PageHeader
        title={t('sidebar.reports')}
        description={t('categories.subtitle')}
        actions={
          <ExportMenu
            reportType={type}
            filters={{ search, from, to, status, courseId, categoryId }}
          />
        }
      />

      <FilterBar>
        <Select value={type} onValueChange={(value) => setFilter('type', value as ReportType)}>
          <SelectTrigger className="w-full sm:w-72" aria-label="Report type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </p>
                {group.types.map((reportType) => (
                  <SelectItem key={reportType} value={reportType}>
                    {locale === 'am' && REPORT_TYPE_LABELS_AM[reportType]
                      ? REPORT_TYPE_LABELS_AM[reportType]
                      : reportType.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <SearchBar
          placeholder={locale === 'am' ? 'ፈልግ...' : 'Search...'}
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
        <SelectFilter
          label={t('common.status')}
          value={status}
          onChange={(value) => setFilter('status', value)}
          options={[
            { label: locale === 'am' ? 'ንቁ' : t('common.active'), value: 'ACTIVE' },
            {
              label: locale === 'am' ? 'ማረጋገጫ በመጠባበቅ ላይ' : t('common.pending'),
              value: 'PENDING_VERIFICATION',
            },
            { label: locale === 'am' ? 'የተቀመጠ' : t('common.archived'), value: 'ARCHIVED' },
            {
              label: locale === 'am' ? 'የተጠናቀቀ' : t('dashboard.completedCourses'),
              value: 'COMPLETED',
            },
            {
              label: locale === 'am' ? 'በሂደት ላይ' : t('dashboard.enrolledCourses'),
              value: 'IN_PROGRESS',
            },
            { label: locale === 'am' ? 'የታገደ' : 'Suspended', value: 'SUSPENDED' },
          ]}
        />
        <SelectFilter
          label={t('nav.courses')}
          value={courseId}
          onChange={(value) => setFilter('courseId', value)}
          options={courseOptions}
        />
        <SelectFilter
          label={t('nav.categories')}
          value={categoryId}
          onChange={(value) => setFilter('categoryId', value)}
          options={categoryOptions}
        />
      </FilterBar>

      <ReportTable
        result={reportQuery.data}
        isLoading={reportQuery.isLoading}
        isFetching={reportQuery.isFetching}
        isError={reportQuery.isError}
        onRetry={() => reportQuery.refetch()}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <ExportsList />
    </ContentContainer>
  );
}
