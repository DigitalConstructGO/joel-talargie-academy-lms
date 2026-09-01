import type { Metadata } from 'next';
import { Award, CheckCircle2, UserRound } from 'lucide-react';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { JsonLd } from '@/components/common/json-ld';
import { buildBreadcrumbJsonLd } from '@/lib/json-ld';
import { CourseCard } from '@/features/catalog/components/course-card';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import {
  deriveInstructors,
  DEFAULT_LEAD_INSTRUCTOR,
} from '@/features/instructors/utils/derive-instructors';
import { ROUTES } from '@/constants/routes';
import { Badge } from '@/components/ui/badge';

import { usersApi } from '@/features/users/api/users.api';

interface InstructorPageProps {
  params: Promise<{ slug: string }>;
}

async function loadData(name: string) {
  try {
    const [coursesRes, usersRes] = await Promise.allSettled([
      catalogApi.listCourses({ pageSize: 100, sort: 'newest' }),
      usersApi.list({ pageSize: 100 }),
    ]);

    const courses = coursesRes.status === 'fulfilled' ? coursesRes.value.items : [];
    const instructorUsers =
      usersRes.status === 'fulfilled'
        ? usersRes.value.items.map((u) => ({
            name: (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim() || u.email,
            photoUrl: u.avatarUrl || undefined,
            avatarUrl: u.avatarUrl || undefined,
            bio: u.bio || undefined,
          }))
        : [];

    const derived = deriveInstructors(courses, instructorUsers);
    const decodedName = decodeURIComponent(name).trim();
    const instructor = derived.find(
      (inst) =>
        inst.name.toLowerCase() === decodedName.toLowerCase() ||
        (inst.slug && inst.slug.toLowerCase() === name.toLowerCase()) ||
        (/joel\s*tal/i.test(decodedName) && /joel\s*tal/i.test(inst.name)),
    );
    return {
      instructor: instructor ?? {
        ...DEFAULT_LEAD_INSTRUCTOR,
        name: decodedName,
      },
      courses: courses.filter(
        (course) => course.presenterName.toLowerCase() === decodedName.toLowerCase(),
      ),
    };
  } catch {
    const decodedName = decodeURIComponent(name).trim();
    return {
      instructor: {
        ...DEFAULT_LEAD_INSTRUCTOR,
        name: decodedName,
      },
      courses: [],
    };
  }
}

export async function generateMetadata({ params }: InstructorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return { title: name, description: `Meet ${name}, Instructor at Joel Talargie Academy` };
}

export default async function InstructorDetailPage({ params }: InstructorPageProps) {
  const { slug } = await params;
  const { instructor, courses } = await loadData(slug);
  const name = instructor.name;

  const breadcrumbItems = [
    { label: 'Home', href: ROUTES.home },
    { label: 'Instructors', href: ROUTES.instructors.list },
    { label: name },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <PageBreadcrumb items={breadcrumbItems} />

      {/* Instructor Profile Header Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/60 p-6 shadow-sm sm:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          {instructor.photoUrl ? (
            <div className="relative size-36 shrink-0 overflow-hidden rounded-2xl border-2 border-brand/20 shadow-md sm:size-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={instructor.photoUrl}
                alt={instructor.name}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <UserRound className="size-12" />
            </span>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-brand/10 text-brand font-medium text-xs">
                  MEET YOUR MENTOR
                </Badge>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {instructor.name}
              </h1>
              {instructor.title && (
                <p className="mt-0.5 text-sm font-semibold text-brand">{instructor.title}</p>
              )}
            </div>

            {instructor.bio && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {instructor.bio}
              </p>
            )}

            {instructor.achievements && instructor.achievements.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {instructor.achievements.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-foreground/90">
                    <CheckCircle2 className="size-4 text-brand shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {instructor.skills && instructor.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {instructor.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[11px]">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Courses Taught by {name}
          </h2>
          <span className="text-xs text-muted-foreground">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <p className="text-sm">No specific courses published yet for this instructor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
