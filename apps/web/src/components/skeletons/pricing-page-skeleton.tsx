import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeaderSkeleton } from './page-header-skeleton';

/** Mirrors `app/(public)/pricing/page.tsx`. */
export function PricingPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="flex flex-col gap-3 p-6">
            <Skeleton className="size-11 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-11 w-44" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <Skeleton className="mx-auto mb-4 h-6 w-40" />
        <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
