import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CtaBannerSkeleton } from './cta-banner-skeleton';

/** Mirrors `app/(public)/about/page.tsx`'s exact section order and shapes. */
export function AboutPageSkeleton() {
  return (
    <div>
      <section className="border-b border-border bg-linear-to-b from-brand/5 via-background to-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
          <Skeleton className="h-9 w-64" />
          <div className="w-full space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="mx-auto h-5 w-3/4" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4"
            >
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <Skeleton className="h-7 w-32" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </section>

      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6">
          {Array.from({ length: 2 }, (_, index) => (
            <Card key={index} className="flex flex-col gap-3 p-6">
              <Skeleton className="size-11 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <Skeleton className="mx-auto mb-8 h-7 w-40" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index} className="flex flex-col gap-3 p-6">
              <Skeleton className="size-11 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-2 sm:px-6">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <Skeleton className="size-11 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <Skeleton className="mb-8 h-7 w-32" />
        <ol className="relative flex flex-col gap-8 border-l border-border pl-6 sm:pl-8">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Skeleton className="mx-auto mb-8 h-7 w-40" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index} className="flex flex-col items-center gap-3 p-6">
                <Skeleton className="size-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CtaBannerSkeleton />
    </div>
  );
}
