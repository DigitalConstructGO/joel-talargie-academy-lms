import { ShoppingCart } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function CheckoutPage() {
  return (
    <ContentContainer>
      <PageHeader title="Checkout" description="Review and complete your course purchases." />
      <ComingSoonSection feature="Checkout" icon={ShoppingCart} />
    </ContentContainer>
  );
}
