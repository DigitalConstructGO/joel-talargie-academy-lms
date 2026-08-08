import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryCardSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Skeleton className="size-11 rounded-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/3" />
    </Card>
  );
}

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </div>
  );
}
