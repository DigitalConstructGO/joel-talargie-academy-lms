import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BreadcrumbSkeleton } from './breadcrumb-skeleton';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';

/** Mirrors `app/(public)/courses/[slug]/page.tsx`. */
export function CourseDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <BreadcrumbSkeleton segments={4} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-border p-4 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="size-8 rounded-full" />
              </div>
              <Skeleton className="h-11 w-full" />
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-4 w-2/3" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <Skeleton className="mb-4 h-6 w-40" />
        <CoursesGridSkeleton count={4} />
      </div>
    </div>
  );
}
