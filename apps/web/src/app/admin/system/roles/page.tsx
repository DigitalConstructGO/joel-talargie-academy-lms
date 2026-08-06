import { ShieldCheck } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminRolesPage() {
  return (
    <ContentContainer>
      <PageHeader title="Roles" description="Manage roles and role assignments." />
      <ComingSoonSection feature="Role management" icon={ShieldCheck} />
    </ContentContainer>
  );
}
