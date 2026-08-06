import { Skeleton } from '@/components/ui/skeleton';

export function BreadcrumbSkeleton({ segments = 3 }: { segments?: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {Array.from({ length: segments }, (_, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-sm text-muted-foreground/30">/</span>}
          <Skeleton className={index === segments - 1 ? 'h-4 w-24' : 'h-4 w-14'} />
        </div>
      ))}
    </div>
  );
}
