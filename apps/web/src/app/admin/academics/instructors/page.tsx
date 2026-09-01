'use client';

import { useMemo } from 'react';
import { UserRound } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { CardSkeletonRow } from '@/components/dashboard/skeletons/card-skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import { deriveInstructors } from '@/features/instructors/utils/derive-instructors';
import { ROUTES } from '@/constants/routes';

interface InstructorsFilters {
  [key: string]: string | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: InstructorsFilters = { search: undefined };

/**
 * The backend has no dedicated instructor entity - courses only carry a
 * free-text `presenterName`. This derives a real, non-fabricated listing
 * from published course data via `deriveInstructors` (already used by the
 * public `/instructors` page) rather than inventing bios/ratings/avatars
 * that don't exist in the schema. Search is delegated to the backend's
 * course search (the DB search vector indexes `presenter_name`), so the
 * frontend never filters the full dataset itself.
 */
import { useLanguage, translateCourseTitle } from '@/lib/i18n/language-provider';

export default function AdminInstructorsPage() {
  const { t, locale } = useLanguage();
  const { filters, setFilter } = useQueryFilters<InstructorsFilters>({
    defaults: DEFAULT_FILTERS,
  });
  const { search } = filters;

  const coursesQuery = useCourses({ pageSize: 100, sort: 'newest', search });

  const instructors = useMemo(
    () => deriveInstructors(coursesQuery.data?.items ?? []),
    [coursesQuery.data],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ትምህርት አስተዳደር' : 'Academics', href: ROUTES.admin.academics },
          { label: locale === 'am' ? 'አስተማሪዎች' : 'Instructors' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'አስተማሪዎች' : 'Instructors'}
        description={
          locale === 'am'
            ? 'የአካዳሚውን አስተማሪዎች እና የሚያስተምሯቸውን ኮርሶች ያስተዳድሩ።'
            : 'Manage academy instructors and their assigned courses.'
        }
      />

      <FilterBar>
        <SearchBar
          placeholder={locale === 'am' ? 'አስተማሪዎችን ፈልግ...' : 'Search instructors...'}
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
      </FilterBar>

      {coursesQuery.isLoading ? (
        <CardSkeletonRow count={8} className="lg:grid-cols-4" />
      ) : coursesQuery.isError ? (
        <ErrorState
          onRetry={() => coursesQuery.refetch()}
          description={locale === 'am' ? 'አስተማሪዎችን መጫን አልተቻለም።' : 'Unable to load instructors.'}
        />
      ) : instructors.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={locale === 'am' ? 'ምንም አስተማሪ አልተገኘም' : 'No instructors found'}
          description={
            search
              ? locale === 'am'
                ? 'ከፍለጋዎ ጋር የሚዛመድ አስተማሪ የለም።'
                : 'No instructors match your search.'
              : locale === 'am'
                ? 'እስካሁን ምንም የታተመ ኮርስ አስተማሪ የለውም።'
                : 'No published courses have a presenter yet.'
          }
          action={
            search ? (
              <Button variant="outline" onClick={() => setFilter('search', undefined)}>
                {locale === 'am' ? 'ፍለጋውን አጽዳ' : 'Clear search'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {instructors.map((instructor) => (
            <Card key={instructor.name} className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {instructor.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {instructor.courseCount}{' '}
                    {locale === 'am' ? 'ኮርሶች' : instructor.courseCount === 1 ? 'course' : 'courses'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {instructor.courses.slice(0, 3).map((course) => (
                  <Badge key={course.id} variant="secondary" className="max-w-full truncate">
                    {translateCourseTitle(course.title, locale)}
                  </Badge>
                ))}
                {instructor.courses.length > 3 && (
                  <Badge variant="outline">
                    {locale === 'am'
                      ? `+${instructor.courses.length - 3} ተጨማሪ`
                      : `+${instructor.courses.length - 3} more`}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </ContentContainer>
  );
}
