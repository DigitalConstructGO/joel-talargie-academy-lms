import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors `features/home/components/cta-banner-section.tsx`. */
export function CtaBannerSkeleton() {
  return (
    <section className="bg-surface-dark">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
        <Skeleton className="h-8 w-64 bg-surface-dark-foreground/10" />
        <Skeleton className="h-4 w-80 bg-surface-dark-foreground/10" />
        <Skeleton className="mt-2 h-11 w-56 bg-surface-dark-foreground/10" />
      </div>
    </section>
  );
}
