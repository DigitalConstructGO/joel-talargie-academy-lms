import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CourseCardSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Skeleton className="aspect-video w-full rounded-none sm:w-56" />
          <div className="flex flex-1 flex-col gap-2 p-4 pt-0 sm:pt-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-auto h-4 w-1/3" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden')}>
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardContent className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CoursesGridSkeleton({
  count = 8,
  view = 'grid',
}: {
  count?: number;
  view?: 'grid' | 'list';
}) {
  return (
    <div
      className={cn(
        view === 'grid'
          ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'flex flex-col gap-4',
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <CourseCardSkeleton key={index} view={view} />
      ))}
    </div>
  );
}
