import { LifeBuoy } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function StudentSupportPage() {
  return (
    <ContentContainer>
      <PageHeader title="Support" description="Get help with your account or courses." />
      <ComingSoonSection feature="Support tickets" icon={LifeBuoy} />
    </ContentContainer>
  );
}
