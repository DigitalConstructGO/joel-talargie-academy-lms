'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/dashboard/skeletons/table-skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  className?: string;

  /** Sticky header row while the table body scrolls. */
  stickyHeader?: boolean;

  /** Adds a checkbox column and reports the selected rows back to the caller. */
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  /** Rendered in the toolbar in place of the default "N selected" text once at least one row is selected. */
  bulkActions?: React.ReactNode;

  /** Adds a "Columns" dropdown to toggle which columns are visible. Requires columns to declare a `header` string or `meta.label`. */
  enableColumnVisibility?: boolean;

  /** Adds a built-in text search box that filters across all columns client-side. */
  enableGlobalFilter?: boolean;
  searchPlaceholder?: string;

  /**
   * Opt into server-driven pagination: pass the current page state and a
   * handler, plus the total page count from your API. When omitted, the
   * table paginates the given `data` client-side (existing behavior).
   */
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyTitle = 'No results',
  emptyDescription = 'There is nothing to show yet.',
  pageSize = 10,
  className,
  stickyHeader = false,
  enableRowSelection = false,
  onRowSelectionChange,
  bulkActions,
  enableColumnVisibility = false,
  enableGlobalFilter = false,
  searchPlaceholder = 'Search…',
  manualPagination = false,
  pageCount,
  pagination: controlledPagination,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const pagination = controlledPagination ?? internalPagination;
  const setPagination = onPaginationChange ?? setInternalPagination;

  const tableColumns = enableRowSelection
    ? [selectionColumn<TData, TValue>(), ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, rowSelection, columnVisibility, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: enableGlobalFilter ? getFilteredRowModel() : undefined,
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
  });

  useEffect(() => {
    if (!onRowSelectionChange) return;
    const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
    onRowSelectionChange(selectedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the selection itself changes
  }, [rowSelection]);

  if (isLoading) {
    return <TableSkeleton rows={5} columns={tableColumns.length || 4} className={className} />;
  }

  const selectedCount = table.getSelectedRowModel().rows.length;
  const showToolbar = enableGlobalFilter || enableColumnVisibility;

  if (data.length === 0 && !showToolbar) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className={className} />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {(showToolbar || selectedCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            {enableGlobalFilter && (
              <Input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 max-w-xs"
              />
            )}
            {selectedCount > 0 &&
              (bulkActions ?? (
                <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
              ))}
          </div>
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Columns3 className="size-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {String(column.columnDef.header ?? column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className={cn(stickyHeader && 'max-h-112 overflow-y-auto')}>
            <Table>
              <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10 bg-background')}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sortDirection = header.column.getIsSorted();
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1.5 text-left font-medium"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sortDirection === 'asc' ? (
                                <ArrowUp className="size-3.5" aria-hidden="true" />
                              ) : sortDirection === 'desc' ? (
                                <ArrowDown className="size-3.5" aria-hidden="true" />
                              ) : (
                                <ArrowUpDown
                                  className="size-3.5 text-muted-foreground/50"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No matching results.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {(manualPagination ? (pageCount ?? 0) > 1 : table.getPageCount() > 1) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.pageIndex + 1} of {manualPagination ? pageCount : table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function selectionColumn<TData, TValue>(): ColumnDef<TData, TValue> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label="Select row"
        onClick={(event) => event.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}
