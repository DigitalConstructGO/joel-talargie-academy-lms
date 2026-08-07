'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCampaign } from '@/features/promotions/hooks/use-admin-campaigns';
import type {
  PromoCampaignType,
  PromoDiscountType,
} from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

const CAMPAIGN_TYPE_OPTIONS: PromoCampaignType[] = [
  'PERCENTAGE_DISCOUNT',
  'FIXED_DISCOUNT',
  'FREE_COURSE',
  'SCHOLARSHIP',
  'BUNDLE_DISCOUNT',
  'REFERRAL_REWARD',
  'CORPORATE_DISCOUNT',
  'FLASH_SALE',
  'SEASONAL_PROMOTION',
];

const formSchema = z.object({
  name: z.string().trim().min(3, 'Enter a campaign name.').max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  type: z.string().min(1, 'Select a type.'),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'FREE']),
  discountValue: z.string().min(1, 'Enter a discount value.'),
  requiresApproval: z.boolean(),
  isAutomatic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminCampaignCreatePage() {
  const router = useRouter();
  const createCampaign = useCreateCampaign();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      requiresApproval: false,
      isAutomatic: false,
    },
  });

  const type = watch('type');
  const discountType = watch('discountType');
  const requiresApproval = watch('requiresApproval');
  const isAutomatic = watch('isAutomatic');

  async function onSubmit(values: FormValues) {
    try {
      const campaign = await createCampaign.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        type: values.type as PromoCampaignType,
        discountType: values.discountType as PromoDiscountType,
        discountValue: Number(values.discountValue),
        requiresApproval: values.requiresApproval,
        isAutomatic: values.isAutomatic,
      });
      toast.success('Campaign created as a draft');
      router.push(ROUTES.admin.financialPromotionDetail(campaign.id));
    } catch {
      toast.error('Could not create this campaign');
    }
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Campaigns', href: ROUTES.admin.financialPromotions },
          { label: 'New campaign' },
        ]}
      />
      <PageHeader
        title="New campaign"
        description="Create a promotional campaign. It starts as a draft."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="Launch Week" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue('type', value, { shouldValidate: true })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountType">Discount type</Label>
              <Select
                value={discountType}
                onValueChange={(value) =>
                  setValue('discountType', value as FormValues['discountType'])
                }
              >
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed amount</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discountType !== 'FREE' && (
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Discount value {discountType === 'PERCENTAGE' ? '(%)' : '(amount)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('discountValue')}
                />
                {errors.discountValue && (
                  <p className="text-sm text-destructive">{errors.discountValue.message}</p>
                )}
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" rows={3} {...register('description')} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <Label htmlFor="requiresApproval">Requires approval</Label>
                <p className="text-xs text-muted-foreground">Redemptions wait for manual review.</p>
              </div>
              <Switch
                id="requiresApproval"
                checked={requiresApproval}
                onCheckedChange={(checked) => setValue('requiresApproval', checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <Label htmlFor="isAutomatic">Automatic</Label>
                <p className="text-xs text-muted-foreground">Applies without a coupon code.</p>
              </div>
              <Switch
                id="isAutomatic"
                checked={isAutomatic}
                onCheckedChange={(checked) => setValue('isAutomatic', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={createCampaign.isPending}>
            {createCampaign.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create campaign
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.financialPromotions)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ContentContainer>
  );
}
