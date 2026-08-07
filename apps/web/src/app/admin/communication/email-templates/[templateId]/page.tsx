import { Mail } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminEmailTemplateDetailPageProps {
  params: Promise<{ templateId: string }>;
}

export default async function AdminEmailTemplateDetailPage({
  params,
}: AdminEmailTemplateDetailPageProps) {
  const { templateId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Email template" description={`Template ${templateId}`} />
      <ComingSoonSection feature="Email template editing" icon={Mail} />
    </ContentContainer>
  );
}
