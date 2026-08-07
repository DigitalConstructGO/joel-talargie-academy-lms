import { BarChart3 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

interface AdminPromotionUsagePageProps {
  params: Promise<{ promotionId: string }>;
}

export default async function AdminPromotionUsagePage({ params }: AdminPromotionUsagePageProps) {
  const { promotionId } = await params;
  return (
    <ContentContainer>
      <PageHeader
        title="Promotion usage"
        description={`Redemption activity for promotion ${promotionId}`}
      />
      <ComingSoonSection feature="Promotion usage analytics" icon={BarChart3} />
    </ContentContainer>
  );
}
