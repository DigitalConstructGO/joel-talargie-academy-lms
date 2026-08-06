import { Layers } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminCategoriesPage() {
  return (
    <ContentContainer>
      <PageHeader title="Categories" description="Manage course categories." />
      <ComingSoonSection feature="Category management" icon={Layers} />
    </ContentContainer>
  );
}
