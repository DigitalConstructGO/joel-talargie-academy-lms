import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors `features/instructors/components/instructor-card.tsx` / `instructor-profile-card.tsx`. */
export function InstructorCardSkeleton() {
  return (
    <Card className="flex flex-col items-center gap-3 p-6 text-center">
      <Skeleton className="size-16 rounded-full" />
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </Card>
  );
}

export function InstructorGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <InstructorCardSkeleton key={index} />
      ))}
    </div>
  );
}
