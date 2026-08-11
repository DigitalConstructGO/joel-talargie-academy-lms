import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors the two-column layout of `features/home/components/hero-section.tsx`. */
export function HeroSkeleton() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-36 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-24 shrink-0" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-44" />
          </div>
        </div>
        <Skeleton className="aspect-4/3 w-full rounded-3xl lg:aspect-square" />
      </div>
    </section>
  );
}
