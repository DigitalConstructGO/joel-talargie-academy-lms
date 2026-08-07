import { Tag } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminPromotionDetailPageProps {
  params: Promise<{ promotionId: string }>;
}

export default async function AdminPromotionDetailPage({ params }: AdminPromotionDetailPageProps) {
  const { promotionId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Promotion details" description={`Promotion ${promotionId}`} />
      <ComingSoonSection feature="Promotion detail view" icon={Tag} />
    </ContentContainer>
  );
}
