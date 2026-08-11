import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('flex flex-col items-center gap-3 p-6', className)}>
      <Skeleton className="size-16 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </Card>
  );
}
