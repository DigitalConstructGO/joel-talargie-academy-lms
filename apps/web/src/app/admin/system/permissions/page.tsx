import { KeyRound } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminPermissionsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Permissions" description="Manage granular permission grants." />
      <ComingSoonSection feature="Permission management" icon={KeyRound} />
    </ContentContainer>
  );
}
