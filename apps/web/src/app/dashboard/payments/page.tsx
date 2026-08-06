import { CreditCard } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function StudentPaymentsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Payments" description="Your payment history and receipts." />
      <ComingSoonSection feature="Payments" icon={CreditCard} />
    </ContentContainer>
  );
}
