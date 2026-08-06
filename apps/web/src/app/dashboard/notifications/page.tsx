import { Bell } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function StudentNotificationsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Notifications" description="Updates about your courses and account." />
      <ComingSoonSection feature="Notification history" icon={Bell} />
    </ContentContainer>
  );
}
