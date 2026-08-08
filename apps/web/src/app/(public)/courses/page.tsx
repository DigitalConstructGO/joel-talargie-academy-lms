import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { JsonLd } from '@/components/common/json-ld';
import { buildItemListJsonLd } from '@/lib/json-ld';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { CourseFilters } from '@/features/catalog/components/course-filters';
import { CoursesGrid } from '@/features/catalog/components/courses-grid';
import { SyncSearchParam } from '@/features/catalog/components/sync-search-param';
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

export default async function CoursesPage() {
  const itemListEntries = await loadItemListEntries();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      {itemListEntries.length > 0 && <JsonLd data={buildItemListJsonLd(itemListEntries)} />}
      <PageHeader
        title="Browse courses"
        description="Explore our full catalog and find the course that fits your goals."
      />
      <Suspense fallback={null}>
        <SyncSearchParam />
      </Suspense>
      <CourseFilters />
      <CoursesGrid />
    </div>
  );
}
