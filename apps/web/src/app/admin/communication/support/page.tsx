import { LifeBuoy } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { Badge } from '@/components/ui/badge';

export default function AdminCommunicationSupportPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Support"
        description="Student support requests."
        actions={<Badge variant="warning">Coming Soon</Badge>}
      />
      <ComingSoonSection
        feature="Support ticketing"
        icon={LifeBuoy}
        description="There is no support/ticketing module on the backend yet - this section will connect to real ticket data once that module ships."
      />
    </ContentContainer>
  );
}
