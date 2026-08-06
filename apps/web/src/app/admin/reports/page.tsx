import { BarChart3 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminReportsPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Reports & Analytics"
        description="Platform-wide reporting and analytics."
      />
      <ComingSoonSection feature="Reports & analytics" icon={BarChart3} />
    </ContentContainer>
  );
}
