import { Layers } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminCategoryDetailPageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function AdminCategoryDetailPage({ params }: AdminCategoryDetailPageProps) {
  const { categoryId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Category details" description={`Category ${categoryId}`} />
      <ComingSoonSection feature="Category detail view" icon={Layers} />
    </ContentContainer>
  );
}
