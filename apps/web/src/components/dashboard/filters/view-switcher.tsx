'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

export interface ViewSwitcherProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

/** Grid/list icon toggle - mirrors the exact pattern already used by the public catalog's `CourseFilters`. */
export function ViewSwitcher({ view, onChange, className }: ViewSwitcherProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-md border border-border p-0.5', className)}>
      <Button
        type="button"
        variant={view === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        className="size-8"
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        onClick={() => onChange('grid')}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        type="button"
        variant={view === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        className="size-8"
        aria-label="List view"
        aria-pressed={view === 'list'}
        onClick={() => onChange('list')}
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
