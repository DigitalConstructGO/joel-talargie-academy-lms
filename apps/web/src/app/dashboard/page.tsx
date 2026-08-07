'use client';

import { Award, BookOpen, CircleCheck, Loader } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { Reveal } from '@/components/common/reveal';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { ProgressCard } from '@/components/dashboard/progress-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { CourseProgressCard } from '@/components/dashboard/course-progress-card';
import { UpcomingClassCard } from '@/components/dashboard/upcoming-class-card';
import { RecommendationCard } from '@/components/dashboard/recommendation-card';
import { NoCoursesEmptyState } from '@/components/dashboard/empty-states';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import { CardSkeletonRow } from '@/components/dashboard/skeletons/card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { useMyEnrollments } from '@/features/enrollments/hooks/use-enrollments';
import { estimateLessonProgress } from '@/features/enrollments/utils/estimate-lesson-progress';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks/use-notifications';
import { toast } from '@/lib/toast';

/** Mirrors the loaded layout below: banner+progress row, stat row, then course-list + sidebar. */
function DashboardHomeSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-60 lg:col-span-2" />
        <Skeleton className="h-60" />
      </div>
      <CardSkeletonRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName ?? 'there';

  const enrollmentsQuery = useMyEnrollments({ pageSize: 100 });
  const coursesQuery = useCourses({ pageSize: 100 });
  const unreadQuery = useUnreadNotificationsCount();
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
      label: 'Enrolled Courses',
      value: enrollments.length,
      tone: 'primary' as const,
    },
    { icon: Loader, label: 'In Progress', value: inProgress.length, tone: 'info' as const },
    { icon: CircleCheck, label: 'Completed', value: completed.length, tone: 'success' as const },
    {
      icon: Award,
      label: 'Unread Notifications',
      value: unreadQuery.data?.unreadCount ?? 0,
      tone: 'warning' as const,
    },
  ];

  return (
    <ContentContainer>
      <Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <WelcomeBanner
            className="lg:col-span-2"
            greeting={`Welcome back, ${firstName} 👋`}
            description={
              mostRecent
                ? `You've completed ${Math.round(mostRecent.progressPercentage)}% of "${mostRecent.courseTitle}". Keep up the momentum!`
                : "You haven't enrolled in any courses yet - browse the catalog to get started."
            }
            ctaLabel={mostRecent ? 'Resume Learning' : 'Browse Courses'}
            ctaHref={mostRecent ? ROUTES.dashboard.courses : ROUTES.courses.list}
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-foreground">My Courses</h3>
              <Button variant="link" asChild className="h-auto p-0 text-primary">
                <a href={ROUTES.dashboard.courses}>View All</a>
              </Button>
            </div>
            {recentCourses.length === 0 ? (
              <NoCoursesEmptyState
                action={
                  <Button asChild>
                    <a href={ROUTES.courses.list}>Browse courses</a>
                  </Button>
                }
              />
            ) : (
              recentCourses.map((enrollment) => (
                <CourseProgressCard
                  key={enrollment.id}
                  href={ROUTES.courses.detail(enrollment.courseSlug)}
                  category={enrollment.categoryName}
                  categorySlug={enrollment.categorySlug}
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

          <div className="flex flex-col gap-4 lg:col-span-4">
            <UpcomingClassCard
              instructorName="Prof. Elias Thorne"
              instructorTitle="Senior Product Mentor"
              classTitle="Mastering Figma Auto-Layout & Variables"
              date="Today, Oct 24"
              time="04:00 PM - 05:30 PM (GMT+3)"
              onSetReminder={() => toast.success('Reminder set', "We'll notify you before class.")}
            />
            <RecommendationCard
              eyebrow="Recommended for you"
              title="AI-Driven UI Design"
              description="Explore how generative AI is transforming the design workflow."
              href={ROUTES.courses.list}
            />
          </div>
        </div>
      </Reveal>
    </ContentContainer>
  );
}
