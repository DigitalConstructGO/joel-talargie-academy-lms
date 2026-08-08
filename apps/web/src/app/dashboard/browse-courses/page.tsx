import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { CourseFilters } from '@/features/catalog/components/course-filters';
import { CoursesGrid } from '@/features/catalog/components/courses-grid';
import { SyncSearchParam } from '@/features/catalog/components/sync-search-param';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Browse Courses',
};

/**
 * Dashboard-native course browsing (Requirement 2) - an authenticated
 * student never gets routed to the public `/courses` listing. Reuses the
 * exact same filter/grid/URL-sync building blocks as the public page
 * (`CourseFilters`, `CoursesGrid`, `SyncSearchParam`, all already
 * portal-agnostic), just composed inside the dashboard shell instead.
 * Course cards link into the dashboard's own course-detail route
 * (under `ROUTES.dashboard.browseCourses`) so course details also render
 * inside the dashboard shell, not the public course page. `linkBase` is a
 * plain string, not `ROUTES.dashboard.courseDetail` itself - this page is a
 * Server Component and `CoursesGrid` is a Client Component, and functions
 * can't be passed across that boundary.
 */
export default function BrowseCoursesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Browse courses"
        description="Explore the full catalog and find your next course."
      />
      <Suspense fallback={null}>
        <SyncSearchParam />
      </Suspense>
      <CourseFilters />
      <CoursesGrid linkBase={ROUTES.dashboard.browseCourses} />
    </ContentContainer>
  );
}
