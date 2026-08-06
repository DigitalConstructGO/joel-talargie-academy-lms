import { MessageSquare } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminCommunicationPage() {
  return (
    <ContentContainer>
      <PageHeader title="Communication" description="Announcements and notification campaigns." />
      <ComingSoonSection feature="Communication tools" icon={MessageSquare} />
    </ContentContainer>
  );
}
