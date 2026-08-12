import { ContentContainer } from '@/components/layout/content-container';
import { CardSkeletonRow } from '@/components/dashboard/skeletons/card-skeleton';
import { ListSkeleton } from '@/components/dashboard/skeletons/list-skeleton';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <ContentContainer>
      <PageHeader
        title="Reports"
        description="Download and schedule platform reports."
        actions={<Skeleton className="h-10 w-32" />}
      />
      <CardSkeletonRow />
      <ListSkeleton rows={10} />
    </ContentContainer>
  );
}
