import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { JsonLd } from '@/components/common/json-ld';
import { buildBreadcrumbJsonLd } from '@/lib/json-ld';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { getCourseBySlug } from '@/features/catalog/api/catalog.server';
import { CourseCurriculum } from '@/features/catalog/components/course-curriculum';
import { CourseChecklist } from '@/features/catalog/components/course-checklist';
import { CourseEnrollCard } from '@/features/catalog/components/course-enroll-card';
import { CourseCard } from '@/features/catalog/components/course-card';
import { DIFFICULTY_LABELS } from '@/features/catalog/constants/catalog.constants';
import { formatCompactNumber } from '@/lib/format';
import { ROUTES } from '@/constants/routes';
import type { CourseDetail } from '@/features/catalog/types/catalog.types';

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

async function loadCourse(slug: string) {
  const decoded = decodeURIComponent(slug);
  try {
    return await getCourseBySlug(decoded);
  } catch {
    try {
      return await catalogApi.getCourse(decoded, { preview: true });
    } catch {
      return null;
    }
  }
}

async function loadRelatedCourses(course: CourseDetail) {
  if (!course.categoryId) return [];
  try {
    const result = await catalogApi.listCourses({ categoryId: course.categoryId, pageSize: 5 });
    return result.items.filter((item) => item.slug !== course.slug).slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await loadCourse(slug);
  if (!course) return { title: 'Course not found' };
  return {
    title: course.title,
    description: course.shortDescription,
    openGraph: { title: course.title, description: course.shortDescription, type: 'website' },
    twitter: { card: 'summary', title: course.title, description: course.shortDescription },
  };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await loadCourse(slug);
  if (!course) notFound();
  const relatedCourses = await loadRelatedCourses(course);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.shortDescription,
    provider: { '@type': 'Organization', name: 'Joel Talargie Academy' },
    ...(course.rating !== undefined
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: course.rating,
            reviewCount: course.studentsCount ?? 0,
          },
        }
      : {}),
  };

  const breadcrumbItems = [
    { label: 'Home', href: ROUTES.home },
    { label: 'Courses', href: ROUTES.courses.list },
    ...(course.categoryName && course.categorySlug
      ? [{ label: course.categoryName, href: ROUTES.categories.detail(course.categorySlug) }]
      : []),
    { label: course.title },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <JsonLd data={[jsonLd, buildBreadcrumbJsonLd(breadcrumbItems)]} />

      <PageBreadcrumb items={breadcrumbItems} />

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
              <CourseCard key={relatedCourse.id} course={relatedCourse} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
