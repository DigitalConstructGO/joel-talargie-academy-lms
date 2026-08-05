import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { getCourseBySlug } from '@/features/catalog/api/catalog.server';
import { CourseCurriculum } from '@/features/catalog/components/course-curriculum';
import { CourseChecklist } from '@/features/catalog/components/course-checklist';
import { CourseEnrollCard } from '@/features/catalog/components/course-enroll-card';
import { DIFFICULTY_LABELS } from '@/features/catalog/constants/catalog.constants';
import { ROUTES } from '@/constants/routes';

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

async function loadCourse(slug: string) {
  try {
    return await getCourseBySlug(slug);
  } catch {
    return null;
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.shortDescription,
    provider: { '@type': 'Organization', name: 'Joel Talargie Academy' },
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageBreadcrumb
        items={[
          { label: 'Home', href: ROUTES.home },
          { label: 'Courses', href: ROUTES.courses.list },
          { label: course.title },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{DIFFICULTY_LABELS[course.difficulty]}</Badge>
              {course.certificateEnabled && <Badge variant="info">Certificate included</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.shortDescription}</p>
            <p className="text-sm text-muted-foreground">by {course.presenterName}</p>
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
    </div>
  );
}
