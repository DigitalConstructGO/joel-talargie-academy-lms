'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { CourseCard } from '@/features/catalog/components/course-card';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';
import { NoWishlistEmptyState } from '@/components/dashboard/empty-states';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import { useWishlistStore } from '@/stores';
import { ROUTES } from '@/constants/routes';

import { useLanguage } from '@/lib/i18n/language-provider';

export default function WishlistPage() {
  const { t, locale } = useLanguage();
  const courseIds = useWishlistStore((state) => state.courseIds);
  const coursesQuery = useCourses({ pageSize: 100 });

  const wishlistedCourses = (coursesQuery.data?.items ?? []).filter((course) =>
    courseIds.includes(course.id),
  );

  return (
    <ContentContainer>
      <PageHeader title={t('sidebar.wishlist')} description={t('categories.subtitle')} />

      {courseIds.length === 0 ? (
        <NoWishlistEmptyState
          action={
            <Button asChild>
              <Link href={ROUTES.dashboard.browseCourses}>{t('sidebar.browseCourses')}</Link>
            </Button>
          }
        />
      ) : coursesQuery.isLoading ? (
        <CoursesGridSkeleton count={courseIds.length} />
      ) : coursesQuery.isError ? (
        <DashboardApiErrorState onRetry={() => coursesQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistedCourses.map((course) => (
            <div key={course.id} className="flex flex-col gap-3">
              <CourseCard course={course} href={ROUTES.dashboard.courseDetail(course.slug)} />
              <Button variant="outline" asChild className="w-full">
                <Link
                  href={
                    course.accessType === 'FREE'
                      ? ROUTES.dashboard.courseDetail(course.slug)
                      : `${ROUTES.dashboard.checkout}?course=${course.slug}`
                  }
                >
                  <ShoppingCart className="size-4" />
                  {course.accessType === 'FREE'
                    ? locale === 'am'
                      ? 'በነጻ ተመዝገብ'
                      : 'Enroll Free'
                    : locale === 'am'
                      ? 'ወደ ክፍያ ሂድ'
                      : 'Move to Checkout'}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </ContentContainer>
  );
}
