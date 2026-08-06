import { KeyRound } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function StudentSecurityPage() {
  return (
    <ContentContainer>
      <PageHeader title="Security" description="Manage your password and account security." />
      <ComingSoonSection feature="Security settings" icon={KeyRound} />
    </ContentContainer>
  );
}
