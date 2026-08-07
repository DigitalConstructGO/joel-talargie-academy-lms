import { UserCog } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminUserEditPageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserEditPage({ params }: AdminUserEditPageProps) {
  const { userId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Edit user" description={`Account ${userId}`} />
      <ComingSoonSection feature="User editing" icon={UserCog} />
    </ContentContainer>
  );
}
