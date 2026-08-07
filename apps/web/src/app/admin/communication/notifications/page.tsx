import { Bell } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminCommunicationNotificationsPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Notifications"
        description="System-wide notification activity and delivery."
      />
      <ComingSoonSection feature="Notification oversight" icon={Bell} />
    </ContentContainer>
  );
}
