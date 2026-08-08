import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-16 sm:px-6">
      <Card className="w-full">
        <CardHeader className="items-center gap-3 text-center">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}
