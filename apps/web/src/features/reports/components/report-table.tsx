'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/data-table';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { ErrorState } from '@/components/common/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { formatReportValue, humanizeKey } from '../utils/humanize-key';
import type { ReportResult } from '../types/report.types';

export interface ReportTableProps {
  result: ReportResult | undefined;
  isLoading: boolean;
  /** Covers refetches too (filter/page changes), not just the initial load - defaults to `isLoading` when omitted. */
  isFetching?: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
}

function SummaryValue({ value }: { value: unknown }) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-foreground">
        {entries.map(([key, entry]) => (
          <span key={key}>
            {humanizeKey(key)}: {formatReportValue(entry)}
          </span>
        ))}
      </div>
    );
  }
  return <p className="text-lg font-semibold text-foreground">{formatReportValue(value)}</p>;
}

/**
 * Renders any `{ summary, rows, meta }` report generically - columns are
 * derived from whatever keys the backend actually returns for that report
 * type, so this never claims a field the API doesn't promise. Shared by
 * Reports and Activity Logs (`ADMINISTRATOR_ACTIVITY` uses this same
 * endpoint shape under the hood).
 */
export function ReportTable({
  result,
  isLoading,
  isFetching = isLoading,
  isError,
  onRetry,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  onRowClick,
}: ReportTableProps) {
  const rows = useMemo(() => result?.rows ?? [], [result?.rows]);
  const keys = useMemo(
    () => (rows.length > 0 ? Object.keys(rows[0] ?? {}).filter((key) => key !== 'id') : []),
    [rows],
  );

  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () =>
      keys.map((key) => ({
        id: key,
        accessorFn: (row) => row[key],
        header: humanizeKey(key),
        cell: ({ getValue }) => formatReportValue(getValue()),
      })),
    [keys],
  );

  const totalPages = Math.max(
    1,
    Math.ceil((result?.meta.total ?? 0) / (result?.meta.pageSize ?? pageSize ?? 10)),
  );

  if (isError) {
    return <ErrorState onRetry={onRetry} description="Unable to load this report." />;
  }

  return (
    <div className="space-y-4">
      {result?.summary && Object.keys(result.summary).length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap gap-6 pt-6">
            {Object.entries(result.summary).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-muted-foreground">{humanizeKey(key)}</p>
                <SummaryValue value={value} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyTitle="No results"
        emptyDescription="No records match your filters."
        manualPagination
        onRowClick={onRowClick}
      />
      {!isLoading && rows.length > 0 && (
        <DynamicPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showFirstLast
          showGoToPage
          isLoading={isFetching}
        />
      )}
    </div>
  );
}
