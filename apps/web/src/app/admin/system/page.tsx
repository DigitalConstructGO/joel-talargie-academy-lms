import { ShieldCheck } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminSystemPage() {
  return (
    <ContentContainer>
      <PageHeader title="System" description="Roles, permissions, and platform configuration." />
      <ComingSoonSection feature="System administration" icon={ShieldCheck} />
    </ContentContainer>
  );
}
