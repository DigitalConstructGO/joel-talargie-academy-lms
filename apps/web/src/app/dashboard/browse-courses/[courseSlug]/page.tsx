'use client';

import { useParams } from 'next/navigation';
import { Star, Users } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { ErrorState } from '@/components/common/error-state';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourse, useCourses } from '@/features/catalog/hooks/use-courses';
import { CourseChecklist } from '@/features/catalog/components/course-checklist';
import { CourseCurriculum } from '@/features/catalog/components/course-curriculum';
import { CourseEnrollCard } from '@/features/catalog/components/course-enroll-card';
import { CourseCard } from '@/features/catalog/components/course-card';
import { DIFFICULTY_LABELS } from '@/features/catalog/constants/catalog.constants';
import { formatCompactNumber } from '@/lib/format';
import { ROUTES } from '@/constants/routes';

function CourseDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl lg:col-span-1" />
    </div>
  );
}

export default function DashboardCourseDetailPage() {
  const params = useParams<{ courseSlug: string }>();
  const slug = params.courseSlug;

  const courseQuery = useCourse(slug);
  const relatedQuery = useCourses(
    { categoryId: courseQuery.data?.categoryId, pageSize: 5 },
    { enabled: Boolean(courseQuery.data?.categoryId) },
  );

  if (courseQuery.isLoading) {
    return (
      <ContentContainer>
        <CourseDetailSkeleton />
      </ContentContainer>
    );
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <ContentContainer>
        <ErrorState
          title="We couldn't load this course"
          description="It may have been removed or is no longer available."
          onRetry={() => courseQuery.refetch()}
        />
      </ContentContainer>
    );
  }

  const course = courseQuery.data;
  const relatedCourses = (relatedQuery.data?.items ?? [])
    .filter((item) => item.slug !== course.slug)
    .slice(0, 4);

  return (
    <ContentContainer>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{DIFFICULTY_LABELS[course.difficulty]}</Badge>
              {course.certificateEnabled && <Badge variant="info">Certificate included</Badge>}
              {course.language && <Badge variant="outline">{course.language}</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{course.title}</h1>
            {course.subtitle && <p className="text-lg text-muted-foreground">{course.subtitle}</p>}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>
                by <span className="font-medium text-foreground">{course.presenterName}</span>
              </span>
              {course.rating !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-warning text-warning" />
                  <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
                </span>
              )}
              {course.studentsCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="size-4" />
                  {formatCompactNumber(course.studentsCount)} students
                </span>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
            <h2 className="text-lg font-semibold text-foreground">About this course</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {course.description}
            </p>
          </div>

          <CourseChecklist title="What you'll learn" items={course.outcomes} variant="check" />
          <CourseChecklist title="Requirements" items={course.requirements} variant="dot" />
          <CourseCurriculum sections={course.sections} />
        </div>

        <div className="lg:col-span-1">
          <CourseEnrollCard course={course} />
        </div>
      </div>

      {relatedCourses.length > 0 && (
        <div className="border-t border-border pt-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Related courses</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedCourses.map((relatedCourse) => (
              <CourseCard
                key={relatedCourse.id}
                course={relatedCourse}
                href={ROUTES.dashboard.courseDetail(relatedCourse.slug)}
              />
            ))}
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
