import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PublicPaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  className?: string;
}

function buildHref(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

function buildPageRange(page: number, totalPages: number): (number | 'ellipsis')[] {
  const totalNumbers = 7;
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const leftSibling = Math.max(page - 1, 1);
  const rightSibling = Math.min(page + 1, totalPages);
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

/** Server-rendered, link-based pagination for SSR pages (uses `?page=` query params instead of client state). */
export function PublicPagination({ page, totalPages, basePath, className }: PublicPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildPageRange(page, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full items-center justify-center gap-1', className)}
    >
      <Link
        href={buildHref(basePath, Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        aria-label="Go to previous page"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'default' }),
          'gap-1 pl-2.5',
          page <= 1 && 'pointer-events-none opacity-50',
        )}
      >
        <ChevronLeft className="size-4" />
        <span>Previous</span>
      </Link>

      {pages.map((entry, index) =>
        entry === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center"
          >
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <Link
            key={entry}
            href={buildHref(basePath, entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              buttonVariants({ variant: entry === page ? 'outline' : 'ghost', size: 'icon' }),
            )}
          >
            {entry}
          </Link>
        ),
      )}

      <Link
        href={buildHref(basePath, Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        aria-label="Go to next page"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'default' }),
          'gap-1 pr-2.5',
          page >= totalPages && 'pointer-events-none opacity-50',
        )}
      >
        <span>Next</span>
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
