import { Wallet } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminFinancialPage() {
  return (
    <ContentContainer>
      <PageHeader title="Financial Management" description="Payments and promotions overview." />
      <ComingSoonSection feature="Financial management" icon={Wallet} />
    </ContentContainer>
  );
}
