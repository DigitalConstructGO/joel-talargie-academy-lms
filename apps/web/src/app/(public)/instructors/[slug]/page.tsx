import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { CourseCard } from '@/features/catalog/components/course-card';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { ROUTES } from '@/constants/routes';

interface InstructorPageProps {
  params: Promise<{ slug: string }>;
}

async function loadInstructorCourses(name: string) {
  const result = await catalogApi.listCourses({ search: name, pageSize: 100 });
  return result.items.filter((course) => course.presenterName === name);
}

export async function generateMetadata({ params }: InstructorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return { title: name, description: `Courses taught by ${name}` };
}

export default async function InstructorDetailPage({ params }: InstructorPageProps) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  const courses = await loadInstructorCourses(name);
  if (courses.length === 0) notFound();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <PageBreadcrumb
        items={[
          { label: 'Home', href: ROUTES.home },
          { label: 'Instructors', href: ROUTES.instructors.list },
          { label: name },
        ]}
      />

      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UserRound className="size-7" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
