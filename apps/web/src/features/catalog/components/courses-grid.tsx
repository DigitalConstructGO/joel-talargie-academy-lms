'use client';

import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { useFilterStore } from '@/stores';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { cn } from '@/lib/utils';
import { useCourses } from '../hooks/use-courses';
import { CourseCard } from './course-card';
import { CoursesGridSkeleton } from './course-card-skeleton';
import {
  DEFAULT_CATALOG_FILTERS,
  DEFAULT_PAGE_SIZE,
  type CatalogFilters,
} from '../constants/catalog.constants';
import type { CourseAccessType, CourseDifficulty, CourseSort } from '../types/catalog.types';

export interface CoursesGridProps {
  /**
   * Overrides `CourseCard`'s default public link target, e.g. for the
   * dashboard's own course-detail route. A plain string prefix (not a
   * function) - this can be passed down from a Server Component page, and
   * functions aren't serializable across that boundary.
   */
  linkBase?: string;
}

export function CoursesGrid({ linkBase }: CoursesGridProps = {}) {
  const { filters, page, pageSize, setPage, resetFilters } = useQueryFilters<CatalogFilters>({
    defaults: DEFAULT_CATALOG_FILTERS,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const view = useFilterStore((state) => state.view);

  const { data, isLoading, isFetching, isError, refetch } = useCourses({
    search: filters.search || undefined,
    categoryId: filters.categoryId,
    accessType: filters.accessType as CourseAccessType | undefined,
    difficulty: filters.difficulty as CourseDifficulty | undefined,
    sort: (filters.sort as CourseSort) || 'newest',
    page,
    pageSize,
  });

  if (isLoading) return <CoursesGridSkeleton view={view} count={pageSize} />;

  if (isError) {
    return <ErrorState title="Unable to search courses. Please try again." onRetry={() => refetch()} />;
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={
          filters.search
            ? `No courses found for "${filters.search}"`
            : 'No courses found'
        }
        description="Try adjusting your search terms or filters."
        action={
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Reset filters
          </button>
        }
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          view === 'grid'
            ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'flex flex-col gap-4',
        )}
      >
        {data.items.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            view={view}
            href={linkBase ? `${linkBase}/${course.slug}` : undefined}
          />
        ))}
      </div>
      <DynamicPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isFetching}
      />
    </div>
  );
}
