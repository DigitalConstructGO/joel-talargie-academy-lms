import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors `features/home/components/stats-band-section.tsx`. */
export function StatsBandSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-2 text-center">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </section>
  );
}
