import { BookOpen } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminCourseCreatePage() {
  return (
    <ContentContainer>
      <PageHeader title="New course" description="Add a course to the catalog." />
      <ComingSoonSection feature="Course creation" icon={BookOpen} />
    </ContentContainer>
  );
}
