import { Award } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminCertificatesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Certificate Management"
        description="Manage certificate templates and issuance."
      />
      <ComingSoonSection feature="Certificate management" icon={Award} />
    </ContentContainer>
  );
}
