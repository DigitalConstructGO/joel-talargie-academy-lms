import { Award } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function CertificatesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Certificates"
        description="Certificates you've earned from completed courses."
      />
      <ComingSoonSection feature="Certificates" icon={Award} />
    </ContentContainer>
  );
}
