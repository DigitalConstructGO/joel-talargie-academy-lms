import { Layers } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminCourseCurriculumPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminCourseCurriculumPage({
  params,
}: AdminCourseCurriculumPageProps) {
  const { courseId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Curriculum" description={`Sections and lessons for course ${courseId}`} />
      <ComingSoonSection feature="Curriculum management" icon={Layers} />
    </ContentContainer>
  );
}
