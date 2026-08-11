import { CardSkeletonRow } from './card-skeleton';
import { ChartSkeleton } from './chart-skeleton';
import { ListSkeleton } from './list-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Composite full-page loading state for a dashboard home page: stat row + chart + activity list. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <CardSkeletonRow />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartSkeleton className="lg:col-span-2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <ListSkeleton rows={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
