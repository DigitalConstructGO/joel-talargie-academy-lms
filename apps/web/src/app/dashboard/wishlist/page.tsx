import { Heart } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function WishlistPage() {
  return (
    <ContentContainer>
      <PageHeader title="Wishlist" description="Courses you've saved for later." />
      <ComingSoonSection feature="Wishlist" icon={Heart} />
    </ContentContainer>
  );
}
