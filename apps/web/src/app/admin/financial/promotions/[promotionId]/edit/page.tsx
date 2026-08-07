'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminCampaign,
  useUpdateCampaign,
} from '@/features/promotions/hooks/use-admin-campaigns';
import type { PromoCampaignStatus } from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

const STATUS_OPTIONS: PromoCampaignStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'];

export default function AdminCampaignEditPage() {
  const { promotionId } = useParams<{ promotionId: string }>();
  const router = useRouter();
  const campaignQuery = useAdminCampaign(promotionId);
  const updateCampaign = useUpdateCampaign();
  const campaign = campaignQuery.data;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PromoCampaignStatus>('DRAFT');
  const [discountValue, setDiscountValue] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description ?? '');
      setStatus(campaign.status);
      setDiscountValue(campaign.discountValue);
      setMaxRedemptions(campaign.maxRedemptions?.toString() ?? '');
    }
  }, [campaign]);

  async function handleSave() {
    try {
      await updateCampaign.mutateAsync({
        campaignId: promotionId,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          discountValue: Number(discountValue),
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        },
      });
      toast.success('Campaign updated');
      router.push(ROUTES.admin.financialPromotionDetail(promotionId));
    } catch {
      toast.error('Could not update this campaign');
    }
  }

  if (campaignQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Edit campaign" />
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
          { label: 'Edit' },
        ]}
      />
      <PageHeader title="Edit campaign" description={campaign?.name} />

      {campaignQuery.isLoading || !campaign ? (
        <Skeleton className="h-96" />
      ) : (
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as PromoCampaignStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {campaign.discountType !== 'FREE' && (
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="maxRedemptions">Max redemptions (optional)</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min="1"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={handleSave} disabled={!name.trim() || updateCampaign.isPending}>
                {updateCampaign.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.admin.financialPromotionDetail(promotionId))}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </ContentContainer>
  );
}
