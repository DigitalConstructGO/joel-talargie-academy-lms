import { BookOpen } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminCourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminCourseDetailPage({ params }: AdminCourseDetailPageProps) {
  const { courseId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Course details" description={`Course ${courseId}`} />
      <ComingSoonSection feature="Course detail view" icon={BookOpen} />
    </ContentContainer>
  );
}
