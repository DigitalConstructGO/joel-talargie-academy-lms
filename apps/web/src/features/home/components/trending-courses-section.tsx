import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { CourseCard } from '@/features/catalog/components/course-card';
import type { CourseSummary } from '@/features/catalog/types/catalog.types';

export function TrendingCoursesSection({ courses }: { courses: CourseSummary[] }) {
  if (courses.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Trending now</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The most popular courses with students right now.
        </p>
      </div>
      <Carousel opts={{ align: 'start' }}>
        <CarouselContent>
          {courses.map((course) => (
            <CarouselItem key={course.id} className="sm:basis-1/2 lg:basis-1/4">
              <CourseCard course={course} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-6 flex items-center justify-center gap-2">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </Carousel>
    </section>
  );
}
