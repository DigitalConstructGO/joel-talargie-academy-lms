import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Generic centered heading + subheading + card-row placeholder, sized to a
 * representative section height. Used for marketing sections whose exact
 * markup isn't mirrored 1:1 - keeps overall page scroll height close to the
 * real thing without enumerating every section's literal layout.
 */
export function SectionPlaceholderSkeleton({
  cards = 3,
  bordered = false,
}: {
  cards?: number;
  bordered?: boolean;
}) {
  return (
    <section className={cn('border-border', bordered && 'border-t bg-muted/20')}>
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
