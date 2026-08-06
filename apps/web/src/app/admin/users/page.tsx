import { Users } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminUsersPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="User Management"
        description="Manage students, instructors, and administrators."
      />
      <ComingSoonSection feature="User management" icon={Users} />
    </ContentContainer>
  );
}
