import { ShieldCheck } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminRoleCreatePage() {
  return (
    <ContentContainer>
      <PageHeader title="New role" description="Create a role and assign its permissions." />
      <ComingSoonSection feature="Role creation" icon={ShieldCheck} />
    </ContentContainer>
  );
}
