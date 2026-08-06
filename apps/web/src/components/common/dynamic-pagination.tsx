'use client';

import { useState } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DynamicPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;

  /** When provided (with `onPageSizeChange`), renders a page-size selector alongside the page controls. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;

  /** Adds "first page" / "last page" jump buttons. */
  showFirstLast?: boolean;

  /** Adds a "Go to page" number input. */
  showGoToPage?: boolean;
}

function buildPageRange(
  page: number,
  totalPages: number,
  siblingCount: number,
): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 5;
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const range: (number | 'ellipsis')[] = [1];
  if (showLeftEllipsis) range.push('ellipsis');
  for (
    let pageNumber = Math.max(leftSibling, 2);
    pageNumber <= Math.min(rightSibling, totalPages - 1);
    pageNumber += 1
  ) {
    range.push(pageNumber);
  }
  if (showRightEllipsis) range.push('ellipsis');
  if (totalPages > 1) range.push(totalPages);
  return range;
}

function GoToPageInput({
  totalPages,
  onPageChange,
}: {
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [value, setValue] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
      setValue('');
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <label htmlFor="go-to-page" className="whitespace-nowrap">
        Go to
      </label>
      <Input
        id="go-to-page"
        type="number"
        min={1}
        max={totalPages}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-16"
      />
    </form>
  );
}

export function DynamicPagination({
  page,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  showFirstLast = false,
  showGoToPage = false,
}: DynamicPaginationProps) {
  if (totalPages <= 1 && !pageSize) return null;
  const pages = buildPageRange(page, totalPages, siblingCount);

  return (
    <div
      className={cn('flex flex-col items-center gap-3 sm:flex-row sm:justify-between', className)}
    >
      {pageSize !== undefined && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="First page"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft className="size-4" />
            </Button>
          )}
          <Pagination className="mx-0 w-fit">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                />
              </PaginationItem>
              {pages.map((entry, index) =>
                entry === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={entry}>
                    <PaginationLink
                      href="#"
                      isActive={entry === page}
                      onClick={(event) => {
                        event.preventDefault();
                        onPageChange(entry);
                      }}
                    >
                      {entry}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Last page"
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
            >
              <ChevronsRight className="size-4" />
            </Button>
          )}
          {showGoToPage && <GoToPageInput totalPages={totalPages} onPageChange={onPageChange} />}
        </div>
      )}
    </div>
  );
}
