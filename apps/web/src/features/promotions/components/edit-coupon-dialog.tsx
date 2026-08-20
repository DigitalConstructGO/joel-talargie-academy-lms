'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminCouponDetail,
  useUpdateCoupon,
} from '@/features/promotions/hooks/use-admin-coupons';
import {
  CouponTargetingFields,
  type CouponTargetType,
} from '@/features/promotions/components/coupon-targeting-fields';
import type {
  Coupon,
  CouponRules,
  PromoCodeStatus,
  PromoDiscountType,
} from '@/features/promotions/types/admin-promotion.types';
import { toast } from '@/lib/toast';

const STATUS_OPTIONS: { label: string; value: PromoCodeStatus }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Revoked', value: 'REVOKED' },
];

const DISCOUNT_TYPE_OPTIONS: { label: string; value: PromoDiscountType }[] = [
  { label: 'Percentage', value: 'PERCENTAGE' },
  { label: 'Fixed amount', value: 'FIXED' },
  { label: 'Free', value: 'FREE' },
];

export function EditCouponDialog({
  coupon,
  initialRules,
  open,
  onOpenChange,
}: {
  coupon: Coupon;
  initialRules?: CouponRules;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useAdminCouponDetail(coupon.id, open && !initialRules);
  const rules = initialRules ?? detailQuery.data?.rules ?? null;
  const hasRules = initialRules !== undefined || detailQuery.data !== undefined;

  const [status, setStatus] = useState<PromoCodeStatus>(coupon.status);
  const [discountType, setDiscountType] = useState<PromoDiscountType>(coupon.discountType);
  const [discountValue, setDiscountValue] = useState(coupon.discountValue);
  const [isSingleUse, setIsSingleUse] = useState(coupon.isSingleUse);
  const [maxUsers, setMaxUsers] = useState(coupon.maxUsers?.toString() ?? '');
  const [validFrom, setValidFrom] = useState(coupon.validFrom?.slice(0, 10) ?? '');
  const [validUntil, setValidUntil] = useState(coupon.validUntil?.slice(0, 10) ?? '');
  const [targetType, setTargetType] = useState<CouponTargetType>('ALL');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const updateCoupon = useUpdateCoupon();

  // Re-seed local state whenever the dialog opens or the targeting rules
  // become available (the list page loads them lazily from the detail query).
  useEffect(() => {
    if (!open || !hasRules) return;
    setStatus(coupon.status);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setIsSingleUse(coupon.isSingleUse);
    setMaxUsers(coupon.maxUsers?.toString() ?? '');
    setValidFrom(coupon.validFrom?.slice(0, 10) ?? '');
    setValidUntil(coupon.validUntil?.slice(0, 10) ?? '');
    const courseIds = rules?.courseIds ?? [];
    const categoryIds = rules?.categoryIds ?? [];
    setSelectedCourseIds(courseIds);
    setSelectedCategoryIds(categoryIds);
    setTargetType(courseIds.length ? 'COURSES' : categoryIds.length ? 'CATEGORIES' : 'ALL');
    setError('');
  }, [open, hasRules, coupon, rules]);

  function handleTargetTypeChange(value: CouponTargetType) {
    setTargetType(value);
    if (value === 'CATEGORIES') setSelectedCourseIds([]);
    if (value === 'COURSES') setSelectedCategoryIds([]);
    if (value === 'ALL') {
      setSelectedCourseIds([]);
      setSelectedCategoryIds([]);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (discountType !== 'FREE' && !discountValue.trim()) {
      setError('Enter a discount value.');
      return;
    }
    try {
      await updateCoupon.mutateAsync({
        couponId: coupon.id,
        input: {
          status,
          discountType,
          discountValue: Number(discountValue) || 0,
          isSingleUse,
          maxUsers: maxUsers.trim() ? Number(maxUsers) : null,
          validFrom: validFrom ? new Date(validFrom).toISOString() : null,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          courseIds: targetType === 'COURSES' ? selectedCourseIds : [],
          categoryIds: targetType === 'CATEGORIES' ? selectedCategoryIds : [],
        },
      });
      toast.success('Promo code updated');
      onOpenChange(false);
    } catch {
      setError('Could not update this promo code.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit <code>{coupon.code}</code>
          </DialogTitle>
        </DialogHeader>
        {!hasRules ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-discount-type">Discount type</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as PromoDiscountType)}
                >
                  <SelectTrigger id="edit-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {discountType === 'FREE' ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-discount-value">Discount value</Label>
                  <Input id="edit-discount-value" value="100% off" disabled />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-discount-value">
                    Discount value {discountType === 'PERCENTAGE' ? '(%)' : '(amount)'}
                  </Label>
                  <Input
                    id="edit-discount-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as PromoCodeStatus)}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-users">Max users (blank = unlimited)</Label>
                <Input
                  id="edit-max-users"
                  type="number"
                  min="1"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Limit the code to the first N students who use it (e.g. 50 for a &quot;first
                  50&quot; offer).
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-valid-from">Valid from (blank = immediately)</Label>
                <Input
                  id="edit-valid-from"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valid-until">Valid until (blank = never)</Label>
                <Input
                  id="edit-valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <Checkbox
                id="edit-single-use"
                checked={isSingleUse}
                onCheckedChange={(checked) => setIsSingleUse(Boolean(checked))}
              />
              <div>
                <Label htmlFor="edit-single-use" className="font-medium">
                  Single use
                </Label>
                <p className="text-xs text-muted-foreground">
                  Each student can redeem this code once.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Targeting</Label>
              <p className="text-sm text-muted-foreground">
                Choose which courses this promo code applies to.
              </p>
            </div>
            <CouponTargetingFields
              targetType={targetType}
              onTargetTypeChange={handleTargetTypeChange}
              selectedCategoryIds={selectedCategoryIds}
              onCategoryIdsChange={setSelectedCategoryIds}
              selectedCourseIds={selectedCourseIds}
              onCourseIdsChange={setSelectedCourseIds}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={updateCoupon.isPending}>
                {updateCoupon.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
