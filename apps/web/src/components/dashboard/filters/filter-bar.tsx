import { cn } from '@/lib/utils';

export interface FilterBarProps {
  /** Filter controls (SelectFilter, MultiSelectFilter, DateRangeFilter, etc.) composed by the caller. */
  children: React.ReactNode;
  /** Rendered as a full-width row above the filter controls, e.g. active FilterChips. */
  chips?: React.ReactNode;
  className?: string;
}

/** Generic layout container for a row of filter controls - stays agnostic of what filters it holds. */
export function FilterBar({ children, chips, className }: FilterBarProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 rounded-xl border border-border bg-card p-4', className)}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {chips}
    </div>
  );
}
