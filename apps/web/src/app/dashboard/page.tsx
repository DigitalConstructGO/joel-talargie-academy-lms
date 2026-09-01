'use client';

import Link from 'next/link';
import { Award, Bell, BookOpen, CircleCheck, Heart, Loader } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { Reveal } from '@/components/common/reveal';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { ProgressCard } from '@/components/dashboard/progress-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { CourseProgressCard } from '@/components/dashboard/course-progress-card';
import { NoCoursesEmptyState } from '@/components/dashboard/empty-states';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import { CardSkeletonRow } from '@/components/dashboard/skeletons/card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuthStore, useWishlistStore } from '@/stores';
import { useMyEnrollments } from '@/features/enrollments/hooks/use-enrollments';
import { estimateLessonProgress } from '@/features/enrollments/utils/estimate-lesson-progress';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks/use-notifications';
import { useMyCertificates } from '@/features/certificates/hooks/use-certificates';

/** Mirrors the loaded layout below: banner+progress row, stat row, then course-list + sidebar. */
function DashboardHomeSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-60 lg:col-span-2" />
        <Skeleton className="h-60" />
      </div>
      <CardSkeletonRow />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </>
  );
}

import { useLanguage } from '@/lib/i18n/language-provider';

export default function DashboardPage() {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName ?? 'there';
  const isStudent = user?.roles?.includes('STUDENT') ?? false;

  const enrollmentsQuery = useMyEnrollments(
    {
      pageSize: 100,
      enrollmentStatuses: ['ENROLLED', 'IN_PROGRESS', 'COMPLETED'],
    },
    isStudent,
  );
  const coursesQuery = useCourses({ pageSize: 100 });
  const unreadQuery = useUnreadNotificationsCount();
  const certificatesQuery = useMyCertificates({ pageSize: 100 });
  const wishlistCount = useWishlistStore((state) => state.courseIds.length);
  const lessonCountBySlug = new Map(
    (coursesQuery.data?.items ?? []).map((course) => [course.slug, course.lessonCount]),
  );

  if (enrollmentsQuery.isLoading) {
    return (
      <ContentContainer>
        <DashboardHomeSkeleton />
      </ContentContainer>
    );
  }

  if (enrollmentsQuery.isError) {
    return (
      <ContentContainer>
        <DashboardApiErrorState onRetry={() => enrollmentsQuery.refetch()} />
      </ContentContainer>
    );
  }

  const enrollments = enrollmentsQuery.data?.items ?? [];
  const inProgress = enrollments.filter((enrollment) => enrollment.status === 'IN_PROGRESS');
  const completed = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED');
  const mostRecent = enrollments[0];
  const recentCourses = enrollments.slice(0, 3);

  const stats = [
    {
      icon: BookOpen,
      label: t('dashboard.enrolledCourses'),
      value: enrollments.length,
      tone: 'primary' as const,
    },
    {
      icon: Loader,
      label: t('dashboard.activeCourses'),
      value: inProgress.length,
      tone: 'info' as const,
    },
    {
      icon: CircleCheck,
      label: t('dashboard.completedCourses'),
      value: completed.length,
      tone: 'success' as const,
    },
    {
      icon: Award,
      label: t('dashboard.certificatesEarned'),
      value: certificatesQuery.data?.length ?? 0,
      tone: 'warning' as const,
    },
    { icon: Heart, label: t('sidebar.wishlist'), value: wishlistCount, tone: 'primary' as const },
    {
      icon: Bell,
      label: t('sidebar.notifications'),
      value: unreadQuery.data?.unreadCount ?? 0,
      tone: 'info' as const,
    },
  ];

  return (
    <ContentContainer>
      <Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <WelcomeBanner
            className="lg:col-span-2"
            greeting={`${t('dashboard.welcome')}, ${firstName} 👋`}
            description={
              mostRecent
                ? `You've completed ${Math.round(mostRecent.progressPercentage)}% of "${mostRecent.courseTitle}". Keep up the momentum!`
                : "You haven't enrolled in any courses yet - browse the catalog to get started."
            }
            ctaLabel={mostRecent ? t('dashboard.continueLearning') : t('sidebar.browseCourses')}
            ctaHref={mostRecent ? ROUTES.dashboard.courses : ROUTES.dashboard.browseCourses}
          />
          {mostRecent && (
            <ProgressCard
              label={mostRecent.courseTitle}
              description={`${mostRecent.categoryName}`}
              value={mostRecent.progressPercentage}
            />
          )}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.1}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-foreground">{t('sidebar.myCourses')}</h3>
            <Button variant="link" asChild className="h-auto p-0 text-primary">
              <Link href={ROUTES.dashboard.courses}>{t('categories.browseAll')}</Link>
            </Button>
          </div>
          {recentCourses.length === 0 ? (
            <NoCoursesEmptyState
              action={
                <Button asChild>
                  <Link href={ROUTES.dashboard.browseCourses}>Browse courses</Link>
                </Button>
              }
            />
          ) : (
            recentCourses.map((enrollment) => (
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
                  lessonCountBySlug.get(enrollment.courseSlug),
                )}
              />
            ))
          )}
        </div>
      </Reveal>
    </ContentContainer>
  );
}
