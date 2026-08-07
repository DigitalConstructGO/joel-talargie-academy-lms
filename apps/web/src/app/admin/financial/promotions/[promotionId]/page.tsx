'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Ticket, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/can';
import {
  useAdminCampaign,
  useArchiveCampaign,
} from '@/features/promotions/hooks/use-admin-campaigns';
import type { PromoCampaignStatus } from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

const STATUS_VARIANT: Record<PromoCampaignStatus, 'secondary' | 'success' | 'warning' | 'outline'> =
  {
    DRAFT: 'secondary',
    ACTIVE: 'success',
    PAUSED: 'warning',
    EXPIRED: 'outline',
    ARCHIVED: 'outline',
  };

export default function AdminCampaignDetailPage() {
  const { promotionId } = useParams<{ promotionId: string }>();
  const router = useRouter();
  const campaignQuery = useAdminCampaign(promotionId);
  const archiveCampaign = useArchiveCampaign();
  const campaign = campaignQuery.data;

  async function handleArchive() {
    try {
      await archiveCampaign.mutateAsync(promotionId);
      toast.success('Campaign archived');
      router.push(ROUTES.admin.financialPromotions);
    } catch {
      toast.error('Could not archive this campaign');
    }
  }

  if (campaignQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Campaign details" />
        <ErrorState
          onRetry={() => campaignQuery.refetch()}
          description="Unable to load this campaign."
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Campaigns', href: ROUTES.admin.financialPromotions },
          { label: campaign?.name ?? 'Campaign details' },
        ]}
      />
      <PageHeader
        title={campaign?.name ?? 'Campaign details'}
        description={campaign?.description ?? undefined}
        actions={
          campaign && (
            <div className="flex gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href={`${ROUTES.admin.financialPromoCodes}?campaignId=${campaign.id}`}>
                  <Ticket className="size-4" /> View promo codes
                </Link>
              </Button>
              <Can permission="promotions.update">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={ROUTES.admin.financialPromotionEdit(promotionId)}>
                    <Pencil className="size-4" /> Edit
                  </Link>
                </Button>
              </Can>
              <Can permission="promotions.archive">
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Archive
                    </Button>
                  }
                  title="Archive this campaign?"
                  description="Its coupons will no longer be redeemable."
                  confirmLabel="Archive"
                  variant="destructive"
                  onConfirm={handleArchive}
                />
              </Can>
            </div>
          )
        }
      />

      {campaignQuery.isLoading || !campaign ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[campaign.status]}>{campaign.status}</Badge>
            <Badge variant="outline">{campaign.type.replaceAll('_', ' ')}</Badge>
            {campaign.isAutomatic && <Badge variant="secondary">Automatic</Badge>}
            {campaign.requiresApproval && <Badge variant="secondary">Requires approval</Badge>}
          </div>

          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Discount</p>
                <p className="font-medium text-foreground">
                  {campaign.discountType === 'PERCENTAGE'
                    ? `${campaign.discountValue}%`
                    : campaign.discountType === 'FREE'
                      ? 'Free'
                      : campaign.discountValue}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Redemptions</p>
                <p className="font-medium text-foreground">
                  {campaign.redemptionCount}
                  {campaign.maxRedemptions ? ` / ${campaign.maxRedemptions}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Per-user limit</p>
                <p className="font-medium text-foreground">{campaign.maxRedemptionsPerUser}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Starts</p>
                <p className="font-medium text-foreground">{formatDate(campaign.startsAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ends</p>
                <p className="font-medium text-foreground">
                  {campaign.endsAt ? formatDate(campaign.endsAt) : 'No end date'}
                </p>
              </div>
              {campaign.totalSeats !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Seats</p>
                  <p className="font-medium text-foreground">
                    {campaign.seatsUsed} / {campaign.totalSeats}
                  </p>
                </div>
              )}
              {campaign.description && (
                <div className="sm:col-span-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground">{campaign.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}
