import { Skeleton } from '@/components/ui/skeleton';
import { BreadcrumbSkeleton } from './breadcrumb-skeleton';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';

/** Mirrors `app/(public)/categories/[slug]/page.tsx`. */
export function CategoryDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      <BreadcrumbSkeleton segments={3} />
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex flex-col gap-6">
        <CoursesGridSkeleton count={12} />
        <Skeleton className="mx-auto h-9 w-64" />
      </div>
    </div>
  );
}
