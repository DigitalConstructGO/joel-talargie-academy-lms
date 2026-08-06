import { BookOpen } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminCoursesPage() {
  return (
    <ContentContainer>
      <PageHeader title="Courses" description="Manage the course catalog." />
      <ComingSoonSection feature="Course management" icon={BookOpen} />
    </ContentContainer>
  );
}
