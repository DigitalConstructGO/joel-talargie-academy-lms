import { Activity } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminActivityLogsPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Activity Logs"
        description="Platform-wide administrator and system activity."
      />
      <ComingSoonSection feature="Activity log viewer" icon={Activity} />
    </ContentContainer>
  );
}
