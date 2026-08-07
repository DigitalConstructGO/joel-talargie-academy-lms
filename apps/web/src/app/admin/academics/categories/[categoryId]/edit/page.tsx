import { Layers } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminCategoryEditPageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function AdminCategoryEditPage({ params }: AdminCategoryEditPageProps) {
  const { categoryId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Edit category" description={`Category ${categoryId}`} />
      <ComingSoonSection feature="Category editing" icon={Layers} />
    </ContentContainer>
  );
}
