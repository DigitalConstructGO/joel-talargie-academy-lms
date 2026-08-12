import { ContentContainer } from '@/components/layout/content-container';
import { DashboardSkeleton } from '@/components/dashboard/skeletons/dashboard-skeleton';

export default function AdminDashboardLoading() {
  return (
    <ContentContainer>
      <DashboardSkeleton />
    </ContentContainer>
  );
}
