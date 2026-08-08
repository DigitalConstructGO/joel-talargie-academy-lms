import { PageHeaderSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full rounded-xl" />
      <CoursesGridSkeleton />
    </div>
  );
}
