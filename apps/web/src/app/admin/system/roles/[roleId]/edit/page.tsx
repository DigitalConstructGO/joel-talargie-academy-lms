import { ShieldCheck } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminRoleEditPageProps {
  params: Promise<{ roleId: string }>;
}

export default async function AdminRoleEditPage({ params }: AdminRoleEditPageProps) {
  const { roleId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Edit role" description={`Role ${roleId}`} />
      <ComingSoonSection feature="Role editing" icon={ShieldCheck} />
    </ContentContainer>
  );
}
