import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CoursesPageHeader } from '@/features/catalog/components/courses-page-header';
import { JsonLd } from '@/components/common/json-ld';
import { buildItemListJsonLd } from '@/lib/json-ld';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { CourseFilters } from '@/features/catalog/components/course-filters';
import { CoursesGrid } from '@/features/catalog/components/courses-grid';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Browse Courses',
  description: 'Explore the full course catalog — filter by category, level, and price.',
};

async function loadItemListEntries() {
  try {
    const { items } = await catalogApi.listCourses({ pageSize: 20 });
    return items.map((course) => ({ name: course.title, url: ROUTES.courses.detail(course.slug) }));
  } catch {
    return [];
  }
}

function CoursesFallback() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <CoursesGridSkeleton view="grid" count={12} />
    </div>
  );
}

export default async function CoursesPage() {
  const itemListEntries = await loadItemListEntries();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      {itemListEntries.length > 0 && <JsonLd data={buildItemListJsonLd(itemListEntries)} />}
      <CoursesPageHeader />
      <Suspense fallback={<CoursesFallback />}>
        <CourseFilters />
        <CoursesGrid />
      </Suspense>
    </div>
  );
}
