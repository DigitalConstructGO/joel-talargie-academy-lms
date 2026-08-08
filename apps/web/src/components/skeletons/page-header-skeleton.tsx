import { Skeleton } from '@/components/ui/skeleton';

export function PageHeaderSkeleton({
  withDescription = true,
  withActions = false,
}: {
  withDescription?: boolean;
  withActions?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        {withDescription && <Skeleton className="h-4 w-72" />}
      </div>
      {withActions && <Skeleton className="h-9 w-28" />}
    </div>
  );
}
