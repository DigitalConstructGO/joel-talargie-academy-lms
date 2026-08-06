import { Skeleton } from '@/components/ui/skeleton';
import { BreadcrumbSkeleton } from './breadcrumb-skeleton';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';

/**
 * Mirrors the richer mock-mode branch of `app/(public)/instructors/[slug]/page.tsx`
 * (bio, achievements, skill badges, socials). Deliberately used for both the
 * mock and live data sources - the skeleton fully unmounts before the
 * simpler live-mode content mounts, so there's no layout-shift risk from the
 * shape mismatch.
 */
export function InstructorDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6">
      <BreadcrumbSkeleton segments={3} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col items-center gap-4 lg:col-span-1 lg:items-start">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex flex-col items-center gap-1.5 lg:items-start">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-36" />
          <div className="flex flex-wrap justify-center gap-1.5 lg:justify-start">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="size-9 rounded-full" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <Skeleton className="mb-2 h-6 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div>
            <Skeleton className="mb-2 h-6 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-4 w-3/4" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Skeleton className="mb-4 h-6 w-56" />
        <CoursesGridSkeleton count={4} />
      </div>
    </div>
  );
}
