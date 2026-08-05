import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ContentContainer } from '@/components/layout/content-container';

export default function CoursesPage() {
  return (
    <ContentContainer>
      <PageHeader title="My Courses" description="Courses you're enrolled in will appear here." />
      <EmptyState
        icon={BookOpen}
        title="No courses yet"
        description="Enrollment and course browsing will be implemented in a later phase."
      />
    </ContentContainer>
  );
}
