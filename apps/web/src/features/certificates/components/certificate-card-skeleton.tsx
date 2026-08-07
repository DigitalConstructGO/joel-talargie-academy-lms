import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CertificateCardSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-3 w-24" />
    </Card>
  );
}

export function CertificateCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <CertificateCardSkeleton key={index} />
      ))}
    </div>
  );
}
