import { Mail } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminEmailTemplateCreatePage() {
  return (
    <ContentContainer>
      <PageHeader title="New email template" description="Create a transactional email template." />
      <ComingSoonSection feature="Email template creation" icon={Mail} />
    </ContentContainer>
  );
}
