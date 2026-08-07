import { Layers } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';

export default function AdminCategoryCreatePage() {
  return (
    <ContentContainer>
      <PageHeader title="New category" description="Add a course category." />
      <ComingSoonSection feature="Category creation" icon={Layers} />
    </ContentContainer>
  );
}
