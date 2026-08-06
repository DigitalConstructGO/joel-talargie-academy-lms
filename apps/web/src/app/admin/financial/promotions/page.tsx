import { Tag } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminPromotionsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Promotions" description="Manage discount codes and campaigns." />
      <ComingSoonSection feature="Promotion management" icon={Tag} />
    </ContentContainer>
  );
}
