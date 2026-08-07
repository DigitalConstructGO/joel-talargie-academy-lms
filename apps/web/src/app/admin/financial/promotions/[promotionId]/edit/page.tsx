import { Tag } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminPromotionEditPageProps {
  params: Promise<{ promotionId: string }>;
}

export default async function AdminPromotionEditPage({ params }: AdminPromotionEditPageProps) {
  const { promotionId } = await params;
  return (
    <ContentContainer>
      <PageHeader title="Edit promotion" description={`Promotion ${promotionId}`} />
      <ComingSoonSection feature="Promotion editing" icon={Tag} />
    </ContentContainer>
  );
}
