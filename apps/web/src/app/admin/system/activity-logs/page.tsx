'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { DateRangeFilter } from '@/components/dashboard/filters/date-range-filter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportTable } from '@/features/reports/components/report-table';
import { useReport } from '@/features/reports/hooks/use-reports';
import { humanizeKey, formatReportValue } from '@/features/reports/utils/humanize-key';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 25;

interface ActivityLogsFilters {
  [key: string]: string | undefined;
  search: string | undefined;
  from: string | undefined;
  to: string | undefined;
}

const DEFAULT_FILTERS: ActivityLogsFilters = { search: undefined, from: undefined, to: undefined };

function ActivityDetailDialog({
  entry,
  onClose,
}: {
  entry: Record<string, unknown> | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(entry)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Activity details</DialogTitle>
        </DialogHeader>
        {entry && (
          <dl className="space-y-3 text-sm">
            {Object.entries(entry).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">{humanizeKey(key)}</dt>
                <dd className="break-all text-right font-medium text-foreground">
                  {formatReportValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useLanguage } from '@/lib/i18n/language-provider';

export default function AdminActivityLogsPage() {
  const { t, locale } = useLanguage();
  const { filters, page, pageSize, setFilter, setFilters, setPage } =
    useQueryFilters<ActivityLogsFilters>({ defaults: DEFAULT_FILTERS, pageSize: PAGE_SIZE });
  const { search, from, to } = filters;
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const reportQuery = useReport('ADMINISTRATOR_ACTIVITY', {
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
          { label: t('sidebar.dashboard'), href: ROUTES.admin.root },
          { label: t('sidebar.system'), href: ROUTES.admin.system },
          { label: t('sidebar.activityLogs') },
        ]}
      />
      <PageHeader title={t('sidebar.activityLogs')} description={t('categories.subtitle')} />

      <FilterBar>
        <SearchBar
          placeholder={locale === 'am' ? 'በተግባሪ ወይም እርምጃ ፈልግ...' : 'Search by actor or action...'}
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

      <ReportTable
        result={reportQuery.data}
        isLoading={reportQuery.isLoading}
        isFetching={reportQuery.isFetching}
        isError={reportQuery.isError}
        onRetry={() => reportQuery.refetch()}
        page={page}
        onPageChange={setPage}
        onRowClick={setSelected}
      />

      <ActivityDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </ContentContainer>
  );
}
