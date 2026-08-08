'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminCampaign } from '@/features/promotions/hooks/use-admin-campaigns';
import { useAdminCoupons } from '@/features/promotions/hooks/use-admin-coupons';
import type { PromoCodeStatus } from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

const STATUS_VARIANT: Record<PromoCodeStatus, 'success' | 'warning' | 'outline' | 'destructive'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  EXPIRED: 'outline',
  REVOKED: 'destructive',
};

export default function AdminPromotionUsagePage() {
  const { promotionId } = useParams<{ promotionId: string }>();
  const campaignQuery = useAdminCampaign(promotionId);
  const couponsQuery = useAdminCoupons({ campaignId: promotionId, pageSize: 100 });
  const campaign = campaignQuery.data;
  const coupons = couponsQuery.data?.items ?? [];

  if (campaignQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Promotion usage" />
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
          {
            label: campaign?.name ?? 'Campaign',
            href: campaign ? ROUTES.admin.financialPromotionDetail(promotionId) : undefined,
          },
          { label: 'Usage' },
        ]}
      />
      <PageHeader
        title="Promotion usage"
        description={
          campaign ? `Redemption activity for "${campaign.name}"` : 'Redemption activity'
        }
      />

      {campaignQuery.isLoading || !campaign ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Total redemptions</p>
                <p className="text-xl font-bold text-foreground">
                  {campaign.redemptionCount}
                  {campaign.maxRedemptions ? ` / ${campaign.maxRedemptions}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Per-user limit</p>
                <p className="text-xl font-bold text-foreground">
                  {campaign.maxRedemptionsPerUser}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Coupon codes issued</p>
                <p className="text-xl font-bold text-foreground">{coupons.length}</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Coupon code breakdown</h2>
            {couponsQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : couponsQuery.isError ? (
              <ErrorState
                onRetry={() => couponsQuery.refetch()}
                description="Unable to load this campaign's promo codes."
              />
            ) : coupons.length === 0 ? (
              <EmptyState
                title="No coupon codes yet"
                description={
                  campaign.isAutomatic
                    ? 'This campaign applies automatically and has no coupon codes.'
                    : 'No coupon codes have been generated for this campaign.'
                }
                action={
                  <Link
                    href={`${ROUTES.admin.financialPromoCodes}?campaignId=${promotionId}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Create a promo code
                  </Link>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Redemptions</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <code>{coupon.code}</code>
                        </TableCell>
                        <TableCell>{coupon.codeType}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[coupon.status]}>{coupon.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.redemptionCount}
                          {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ''}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {coupon.validUntil ? formatDate(coupon.validUntil) : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
