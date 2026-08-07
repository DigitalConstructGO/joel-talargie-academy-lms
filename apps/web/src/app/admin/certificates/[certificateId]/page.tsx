import { Award } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminCertificateDetailPageProps {
  params: Promise<{ certificateId: string }>;
}

export default async function AdminCertificateDetailPage({
  params,
}: AdminCertificateDetailPageProps) {
  const { certificateId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Certificate details" description={`Certificate ${certificateId}`} />
      <ComingSoonSection feature="Certificate detail view" icon={Award} />
    </ContentContainer>
  );
}
