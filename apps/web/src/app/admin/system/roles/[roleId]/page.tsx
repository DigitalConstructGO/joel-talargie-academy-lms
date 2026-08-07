import { ShieldCheck } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminRoleDetailPageProps {
  params: Promise<{ roleId: string }>;
}

export default async function AdminRoleDetailPage({ params }: AdminRoleDetailPageProps) {
  const { roleId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Role details" description={`Role ${roleId}`} />
      <ComingSoonSection feature="Role detail view" icon={ShieldCheck} />
    </ContentContainer>
  );
}
