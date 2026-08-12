import { ContentContainer } from '@/components/layout/content-container';
import { DashboardSkeleton } from '@/components/dashboard/skeletons/dashboard-skeleton';
import { PageHeader } from '@/components/common/page-header';

export default function AnalyticsLoading() {
  return (
    <ContentContainer>
      <PageHeader
        title="Analytics"
        description="Platform-wide performance and engagement metrics."
      />
      <DashboardSkeleton />
    </ContentContainer>
  );
}
