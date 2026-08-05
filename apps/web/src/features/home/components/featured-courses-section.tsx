import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { CourseCard } from '@/features/catalog/components/course-card';
import { ROUTES } from '@/constants/routes';
import type { CourseSummary } from '@/features/catalog/types/catalog.types';

export function FeaturedCoursesSection({ courses }: { courses: CourseSummary[] }) {
  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Featured courses
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hand-picked courses to get you started.
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={ROUTES.courses.list}>
              Browse all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No featured courses yet"
            description="Check back soon."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
