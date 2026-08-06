import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function HeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-14 items-center gap-3 border-b border-border px-4', className)}>
      <Skeleton className="h-6 w-6 rounded-md" />
      <Skeleton className="h-4 w-32" />
      <div className="ml-auto flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </div>
    </div>
  );
}
