'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { CourseFilters } from '@/features/catalog/components/course-filters';
import { CoursesGrid } from '@/features/catalog/components/courses-grid';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useLanguage } from '@/lib/i18n/language-provider';

function CoursesFallback() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <CoursesGridSkeleton view="grid" count={12} />
    </div>
  );
}

export default function BrowseCoursesPage() {
  const { t } = useLanguage();
  return (
    <ContentContainer>
      <PageHeader
        title={t('page.browseCourses.title')}
        description={t('page.browseCourses.subtitle')}
      />
      <Suspense fallback={<CoursesFallback />}>
        <CourseFilters />
        <CoursesGrid linkBase={ROUTES.dashboard.browseCourses} />
      </Suspense>
    </ContentContainer>
  );
}
