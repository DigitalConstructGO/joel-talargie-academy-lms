import { UserCircle } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminUserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { userId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="User details" description={`Account ${userId}`} />
      <ComingSoonSection feature="User detail view" icon={UserCircle} />
    </ContentContainer>
  );
}
