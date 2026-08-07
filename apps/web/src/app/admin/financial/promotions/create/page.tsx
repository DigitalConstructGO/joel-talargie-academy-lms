import { Tag } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminPromotionCreatePage() {
  return (
    <ContentContainer>
      <PageHeader title="New promotion" description="Create a discount code or campaign." />
      <ComingSoonSection feature="Promotion creation" icon={Tag} />
    </ContentContainer>
  );
}
