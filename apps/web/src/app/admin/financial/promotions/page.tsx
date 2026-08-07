import Link from 'next/link';
import { Plus, Tag } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/can';
import { ROUTES } from '@/constants/routes';

export default function AdminPromotionsPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Promotions"
        description="Manage discount codes and campaigns."
        actions={
          <Can permission="promotions.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.financialPromotionCreate}>
                <Plus className="size-4" />
                New Promotion
              </Link>
            </Button>
          </Can>
        }
      />
      <ComingSoonSection feature="Promotion management" icon={Tag} />
    </ContentContainer>
  );
}
