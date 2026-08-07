import { BookOpen } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminLessonDetailPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function AdminLessonDetailPage({ params }: AdminLessonDetailPageProps) {
  const { lessonId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Lesson details" description={`Lesson ${lessonId}`} />
      <ComingSoonSection feature="Lesson editing" icon={BookOpen} />
    </ContentContainer>
  );
}
