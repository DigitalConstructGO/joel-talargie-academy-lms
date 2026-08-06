import { GraduationCap } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminAcademicsPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Academic Management"
        description="Courses, categories, and instructors overview."
      />
      <ComingSoonSection feature="Academic management" icon={GraduationCap} />
    </ContentContainer>
  );
}
