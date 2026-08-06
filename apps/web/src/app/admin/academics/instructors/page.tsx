import { UserCog } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminInstructorsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Instructors" description="Manage instructor accounts and assignments." />
      <ComingSoonSection feature="Instructor management" icon={UserCog} />
    </ContentContainer>
  );
}
