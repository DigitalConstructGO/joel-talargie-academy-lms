import Link from 'next/link';
import { Layers, Plus } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/can';
import { ROUTES } from '@/constants/routes';

export default function AdminCategoriesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Categories"
        description="Manage course categories."
        actions={
          <Can permission="categories.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.academicsCategoryCreate}>
                <Plus className="size-4" />
                New Category
              </Link>
            </Button>
          </Can>
        }
      />
      <ComingSoonSection feature="Category management" icon={Layers} />
    </ContentContainer>
  );
}
