import { GraduationCap } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminEnrollmentsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Enrollments" description="Every student enrollment across all courses." />
      <ComingSoonSection feature="Enrollment management" icon={GraduationCap} />
    </ContentContainer>
  );
}
