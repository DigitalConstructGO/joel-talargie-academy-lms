'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Tag, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRedeemCoupon, useValidateCoupon } from '@/features/promotions/hooks/use-promotions';
import type {
  PromotionValidationResult,
  RedeemCouponResult,
} from '@/features/promotions/types/promotion.types';
import { formatCurrency } from '@/lib/format';
import { extractErrorMessage } from '@/lib/api/api-error';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface PromoCodeStepProps {
  courseId: string;
  redemption: RedeemCouponResult | null;
  onApplied: (result: RedeemCouponResult) => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
  isAdvancing?: boolean;
}

export function PromoCodeStep({
  courseId,
  redemption,
  onApplied,
  onClear,
  onBack,
  onNext,
  isAdvancing,
}: PromoCodeStepProps) {
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<PromotionValidationResult | null>(null);
  const validateCoupon = useValidateCoupon();
  const redeemCoupon = useRedeemCoupon();

  async function handleCheck() {
    if (!code.trim()) return;
    setPreview(null);
    try {
      const result = await validateCoupon.mutateAsync({ courseId, code: code.trim() });
      setPreview(result);
      if (!result.valid) toast.error(result.message || 'This code is not valid for this course.');
    } catch {
      toast.error('Could not check that code. Please try again.');
    }
  }

  async function handleApply() {
    try {
      const result = await redeemCoupon.mutateAsync({ courseId, code: code.trim() });
      onApplied(result);
      toast.success('Promo code applied.');
    } catch (error) {
      toast.error(
        'That code could not be applied.',
        extractErrorMessage(error, 'It may have expired or already been used.'),
      );
    }
  }

  function handleRemove() {
    setCode('');
    setPreview(null);
    onClear();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Have a promo code?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Apply a coupon for a discount, or skip this step to continue at full price.
        </p>
      </div>

      {redemption ? (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">{redemption.code} applied</p>
                <p className="text-xs text-muted-foreground">
                  You save{' '}
                  {formatCurrency(redemption.pricing.discountAmount, redemption.pricing.currency)}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="promo-code">Promo code</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="promo-code"
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.toUpperCase());
                      setPreview(null);
                    }}
                    placeholder="e.g. WELCOME15"
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheck}
                  disabled={!code.trim() || validateCoupon.isPending}
                >
                  {validateCoupon.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Check'}
                </Button>
              </div>
            </div>

            {preview && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                  preview.valid
                    ? 'border-success/40 bg-success/5 text-success'
                    : 'border-destructive/40 bg-destructive/5 text-destructive',
                )}
              >
                {preview.valid ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <XCircle className="size-4 shrink-0" />
                )}
                <span>
                  {preview.valid
                    ? `Save ${formatCurrency(preview.pricing.discountAmount, preview.pricing.currency)} with this code.`
                    : preview.message || 'This code is not valid.'}
                </span>
              </div>
            )}

            {preview?.valid && (
              <Button
                type="button"
                onClick={handleApply}
                disabled={redeemCoupon.isPending}
                className="w-full sm:w-auto"
              >
                {redeemCoupon.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Apply code
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={isAdvancing}>
          {isAdvancing && <Loader2 className="mr-2 size-4 animate-spin" />}
          {redemption ? 'Continue' : 'Skip & continue'}
        </Button>
      </div>
    </div>
  );
}
