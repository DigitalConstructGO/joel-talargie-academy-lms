import { Settings } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminAcademySettingsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Academy Settings" description="Platform-wide configuration." />
      <ComingSoonSection feature="Academy settings" icon={Settings} />
    </ContentContainer>
  );
}
