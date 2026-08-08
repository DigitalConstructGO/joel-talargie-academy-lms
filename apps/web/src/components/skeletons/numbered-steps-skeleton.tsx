import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors `features/home/components/how-it-works-section.tsx`. */
export function NumberedStepsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="bg-surface-dark">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-64 bg-surface-dark-foreground/10" />
          <Skeleton className="h-4 w-48 bg-surface-dark-foreground/10" />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 border-t-2 border-surface-dark-foreground/10 pt-4"
            >
              <Skeleton className="h-8 w-10 bg-surface-dark-foreground/10" />
              <Skeleton className="h-4 w-24 bg-surface-dark-foreground/10" />
              <Skeleton className="h-3 w-full bg-surface-dark-foreground/10" />
              <Skeleton className="h-3 w-2/3 bg-surface-dark-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
