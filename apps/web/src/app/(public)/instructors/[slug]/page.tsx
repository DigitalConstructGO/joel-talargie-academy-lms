import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Github, Globe, Linkedin, Star, UserRound, Users } from 'lucide-react';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { JsonLd } from '@/components/common/json-ld';
import { buildBreadcrumbJsonLd } from '@/lib/json-ld';
import { CourseCard } from '@/features/catalog/components/course-card';
import { Badge } from '@/components/ui/badge';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { getInstructorBySlug } from '@/features/instructors/data/mock-instructors.data';
import { InstructorAvatar } from '@/features/instructors/components/instructor-avatar';
import { MOCK_COURSE_RECORDS, toCourseSummary } from '@/features/catalog/data/build-mock-courses';
import { formatCompactNumber } from '@/lib/format';
import { ROUTES } from '@/constants/routes';

interface InstructorPageProps {
  params: Promise<{ slug: string }>;
}

async function loadLiveInstructorCourses(name: string) {
  const result = await catalogApi.listCourses({ search: name, pageSize: 100 });
  return result.items.filter((course) => course.presenterName === name);
}

export async function generateMetadata({ params }: InstructorPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (CATALOG_DATA_SOURCE === 'mock') {
    const instructor = getInstructorBySlug(slug);
    if (!instructor) return { title: 'Instructor not found' };
    return {
      title: instructor.name,
      description: `${instructor.title} - courses taught by ${instructor.name}`,
    };
  }
  const name = decodeURIComponent(slug);
  return { title: name, description: `Courses taught by ${name}` };
}

export default async function InstructorDetailPage({ params }: InstructorPageProps) {
  const { slug } = await params;

  if (CATALOG_DATA_SOURCE === 'mock') {
    const instructor = getInstructorBySlug(slug);
    if (!instructor) notFound();

    const courses = MOCK_COURSE_RECORDS.filter(
      (course) => course.presenterName === instructor.name,
    ).map(toCourseSummary);

    const mockBreadcrumbItems = [
      { label: 'Home', href: ROUTES.home },
      { label: 'Instructors', href: ROUTES.instructors.list },
      { label: instructor.name },
    ];

    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6">
        <JsonLd data={buildBreadcrumbJsonLd(mockBreadcrumbItems)} />
        <PageBreadcrumb items={mockBreadcrumbItems} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-4 text-center lg:col-span-1 lg:items-start lg:text-left">
            <InstructorAvatar instructor={instructor} size={96} className="text-2xl" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {instructor.name}
              </h1>
              <p className="text-sm text-muted-foreground">{instructor.title}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" />
                {instructor.rating.toFixed(1)} rating
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {formatCompactNumber(instructor.studentsCount)} students
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {instructor.yearsExperience}+ years of experience
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 lg:justify-start">
              {instructor.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {instructor.socials.linkedin && (
                <a
                  href={instructor.socials.linkedin}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${instructor.name} on LinkedIn`}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-brand"
                >
                  <Linkedin className="size-4" />
                </a>
              )}
              {instructor.socials.github && (
                <a
                  href={instructor.socials.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${instructor.name} on GitHub`}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-brand"
                >
                  <Github className="size-4" />
                </a>
              )}
              {instructor.socials.website && (
                <a
                  href={instructor.socials.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${instructor.name}'s website`}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-brand"
                >
                  <Globe className="size-4" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">About</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{instructor.bio}</p>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">Achievements</h2>
              <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {instructor.achievements.map((achievement) => (
                  <li key={achievement} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} by {instructor.name}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const name = decodeURIComponent(slug);
  const courses = await loadLiveInstructorCourses(name);
  if (courses.length === 0) notFound();

  const liveBreadcrumbItems = [
    { label: 'Home', href: ROUTES.home },
    { label: 'Instructors', href: ROUTES.instructors.list },
    { label: name },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbJsonLd(liveBreadcrumbItems)} />
      <PageBreadcrumb items={liveBreadcrumbItems} />

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
