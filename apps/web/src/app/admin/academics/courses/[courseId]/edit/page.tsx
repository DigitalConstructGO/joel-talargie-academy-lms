import { BookOpen } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminCourseEditPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminCourseEditPage({ params }: AdminCourseEditPageProps) {
  const { courseId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Edit course" description={`Course ${courseId}`} />
      <ComingSoonSection feature="Course editing" icon={BookOpen} />
    </ContentContainer>
  );
}
