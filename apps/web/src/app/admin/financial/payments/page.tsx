import { CreditCard } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminPaymentsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Payments" description="Review and manage student payments." />
      <ComingSoonSection feature="Payment management" icon={CreditCard} />
    </ContentContainer>
  );
}
