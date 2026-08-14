import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/dashboard/skeletons/table-skeleton';

export default function AdminPaymentMethodsLoading() {
  return (
    <ContentContainer>
      <PageHeader
        title="Payment Methods"
        description="Configure how students can pay at checkout."
        actions={<Skeleton className="h-10 w-32" />}
      />
      <Skeleton className="h-11 w-full sm:w-96" />
      <TableSkeleton rows={6} columns={5} />
    </ContentContainer>
  );
}
