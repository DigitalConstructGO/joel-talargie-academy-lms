'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/common/page-header';
import { SearchBar } from '@/components/common/search-bar';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { ContentContainer } from '@/components/layout/content-container';
import { CourseProgressCard } from '@/components/dashboard/course-progress-card';
import {
  NoCoursesEmptyState,
  NoSearchResultsEmptyState,
} from '@/components/dashboard/empty-states';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { FilterChips } from '@/components/dashboard/filters/filter-chips';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { SavedFiltersMenu } from '@/components/dashboard/filters/saved-filters-menu';
import { ViewSwitcher } from '@/components/dashboard/filters/view-switcher';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useMyEnrollments } from '@/features/enrollments/hooks/use-enrollments';
import { estimateLessonProgress } from '@/features/enrollments/utils/estimate-lesson-progress';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import { useCategories } from '@/features/catalog/hooks/use-categories';
import { CourseCard } from '@/features/catalog/components/course-card';
import { useAuthStore } from '@/stores';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';
import type { EnrollmentStatus } from '@/features/enrollments/types/enrollment.types';

import { useLanguage } from '@/lib/i18n/language-provider';

const PAGE_SIZE = 8;

interface MyCoursesFilters {
  [key: string]: string | undefined;
  status: 'ALL' | EnrollmentStatus;
  categoryId: string | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: MyCoursesFilters = {
  status: 'ALL',
  categoryId: undefined,
  search: undefined,
};

function CoursesListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function CoursesPage() {
  const { t } = useLanguage();
  const { filters, page, setFilter, setFilters, setPage, resetFilters } =
    useQueryFilters<MyCoursesFilters>({ defaults: DEFAULT_FILTERS, pageSize: PAGE_SIZE });
  const { status, categoryId, search } = filters;
  const [view, setView] = usePersistedState<'grid' | 'list'>(
    'joel-academy-my-courses-view',
    'list',
  );
  const { presets, savePreset, removePreset } = useSavedFilters<MyCoursesFilters>('my-courses');

  const user = useAuthStore((state) => state.user);
  const isStudent = user?.roles?.includes('STUDENT') ?? false;

  const categoriesQuery = useCategories({ pageSize: 100 });
  const coursesQuery = useCourses({ pageSize: 100 });
  const enrollmentsQuery = useMyEnrollments(
    {
      page,
      pageSize: PAGE_SIZE,
      status: status === 'ALL' ? undefined : status,
      enrollmentStatuses: ['ENROLLED', 'IN_PROGRESS', 'COMPLETED'],
      categoryId,
      search: search || undefined,
    },
    isStudent,
  );

  const coursesBySlug = new Map(
    (coursesQuery.data?.items ?? []).map((course) => [course.slug, course]),
  );

  const items = enrollmentsQuery.data?.items ?? [];
  const total = enrollmentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = categoryId !== undefined || Boolean(search);
  const selectedCategory = categoriesQuery.data?.items.find(
    (category) => category.id === categoryId,
  );

  return (
    <ContentContainer>
      <PageHeader
        title={t('sidebar.myCourses')}
        description={t('page.browseCourses.subtitle')}
        actions={<ViewSwitcher view={view} onChange={setView} />}
      />

      <Tabs
        value={status}
        onValueChange={(value) => setFilter('status', value as MyCoursesFilters['status'])}
      >
        <TabsList>
          <TabsTrigger value="ALL">{t('common.allLevels')}</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">{t('dashboard.activeCourses')}</TabsTrigger>
          <TabsTrigger value="COMPLETED">{t('dashboard.completedCourses')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(selectedCategory ? [{ key: 'category', label: selectedCategory.name }] : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
              ]}
              onRemove={(key) => {
                if (key === 'category') setFilter('categoryId', undefined);
                if (key === 'search') setFilter('search', undefined);
              }}
              onResetAll={resetFilters}
            />
          ) : undefined
        }
      >
        <SearchBar
          placeholder="Search your courses..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Category"
          value={categoryId}
          onChange={(value) => setFilter('categoryId', value)}
          options={(categoriesQuery.data?.items ?? []).map((category) => ({
            label: category.name,
            value: category.id,
          }))}
        />
        <SavedFiltersMenu
          presets={presets}
          currentFilters={filters}
          onSave={savePreset}
          onApply={(preset) => setFilters(preset)}
          onRemove={removePreset}
        />
      </FilterBar>

      {enrollmentsQuery.isLoading ? (
        view === 'grid' ? (
          <CoursesGridSkeleton count={PAGE_SIZE} />
        ) : (
          <CoursesListSkeleton />
        )
      ) : enrollmentsQuery.isError ? (
        <DashboardApiErrorState onRetry={() => enrollmentsQuery.refetch()} />
      ) : items.length === 0 ? (
        hasActiveFilters || status !== 'ALL' ? (
          <NoSearchResultsEmptyState
            action={
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <NoCoursesEmptyState
            action={
              <Button asChild>
                <Link href={ROUTES.dashboard.browseCourses}>Browse courses</Link>
              </Button>
            }
          />
        )
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((enrollment) => {
            const course = coursesBySlug.get(enrollment.courseSlug);
            return course ? (
              <CourseCard
                key={enrollment.id}
                course={course}
                href={ROUTES.dashboard.learn(enrollment.id)}
              />
            ) : null;
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((enrollment) => (
            <CourseProgressCard
              key={enrollment.id}
              href={ROUTES.dashboard.learn(enrollment.id)}
              category={enrollment.categoryName}
              categorySlug={enrollment.categorySlug}
              thumbnailKey={enrollment.thumbnailKey}
              title={enrollment.courseTitle}
              progressPercent={enrollment.progressPercentage}
              {...estimateLessonProgress(
                enrollment.progressPercentage,
                coursesBySlug.get(enrollment.courseSlug)?.lessonCount,
              )}
            />
          ))}
        </div>
      )}

      <DynamicPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={enrollmentsQuery.isFetching}
      />
    </ContentContainer>
  );
}
