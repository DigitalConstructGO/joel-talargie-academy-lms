'use client';

import { LayoutGrid, List, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchBar } from '@/components/common/search-bar';
import { useFilterStore } from '@/stores';
import { useCategories } from '../hooks/use-categories';
import { DIFFICULTY_LABELS, SORT_LABELS } from '../constants/catalog.constants';
import type { CourseAccessType, CourseDifficulty, CourseSort } from '../types/catalog.types';

const ALL_VALUE = 'all';

export function CourseFilters() {
  const { data } = useCategories({ pageSize: 100 });
  const search = useFilterStore((state) => state.search);
  const categoryId = useFilterStore((state) => state.categoryId);
  const accessType = useFilterStore((state) => state.accessType);
  const difficulty = useFilterStore((state) => state.difficulty);
  const sort = useFilterStore((state) => state.sort);
  const view = useFilterStore((state) => state.view);
  const setSearch = useFilterStore((state) => state.setSearch);
  const setCategoryId = useFilterStore((state) => state.setCategoryId);
  const setAccessType = useFilterStore((state) => state.setAccessType);
  const setDifficulty = useFilterStore((state) => state.setDifficulty);
  const setSort = useFilterStore((state) => state.setSort);
  const setView = useFilterStore((state) => state.setView);
  const resetFilters = useFilterStore((state) => state.resetFilters);

  const hasActiveFilters = Boolean(
    search || categoryId || accessType || difficulty || sort !== 'newest',
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <SearchBar
        placeholder="Search courses…"
        defaultValue={search}
        onSearch={setSearch}
        aria-label="Search courses"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoryId ?? ALL_VALUE}
          onValueChange={(value) => setCategoryId(value === ALL_VALUE ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All categories</SelectItem>
            {data?.items.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={accessType ?? ALL_VALUE}
          onValueChange={(value) =>
            setAccessType(value === ALL_VALUE ? undefined : (value as CourseAccessType))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Access" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Free & Paid</SelectItem>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={difficulty ?? ALL_VALUE}
          onValueChange={(value) =>
            setDifficulty(value === ALL_VALUE ? undefined : (value as CourseDifficulty))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All levels</SelectItem>
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => setSort(value as CourseSort)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button
            type="button"
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
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
            onClick={() => setView('list')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
