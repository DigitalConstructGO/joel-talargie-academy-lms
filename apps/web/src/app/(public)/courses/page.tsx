import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { CourseFilters } from '@/features/catalog/components/course-filters';
import { CoursesGrid } from '@/features/catalog/components/courses-grid';
import { SyncSearchParam } from '@/features/catalog/components/sync-search-param';

export const metadata: Metadata = {
  title: 'Browse Courses',
  description: 'Explore the full course catalog — filter by category, level, and price.',
};

export default function CoursesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
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
