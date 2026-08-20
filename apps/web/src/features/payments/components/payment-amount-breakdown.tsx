import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/format';

export interface PaymentPromoInfo {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE' | null;
  discountValue: string | null;
  originalAmount: string | null;
  discountAmount: string | null;
  finalAmount: string | null;
}

interface PaymentAmountBreakdownProps {
  submittedAmount: string;
  expectedAmount: string;
  currency: string;
  promo?: PaymentPromoInfo | null;
}

function promoLabel(
  code: string,
  type: PaymentPromoInfo['discountType'],
  value: string | null,
  currency: string,
) {
  if (type === 'PERCENTAGE' && value) return `${code} · ${value}% off`;
  if (type === 'FIXED' && value) return `${code} · ${formatCurrency(value, currency)} off`;
  if (type === 'FREE') return `${code} · Free`;
  return code;
}

/**
 * Shared price breakdown for payment detail sheets (student + admin). Shows the
 * course price, the promo-code discount when one was applied (code, percentage,
 * discounted amount), the expected amount, and the amount actually submitted.
 */
export function PaymentAmountBreakdown({
  submittedAmount,
  expectedAmount,
  currency,
  promo,
}: PaymentAmountBreakdownProps) {
  const hasPromo = Boolean(promo?.code && promo.discountAmount !== null);
  const promoInfo = hasPromo && promo ? promo : null;
  const coursePrice = promoInfo ? (promoInfo.originalAmount ?? expectedAmount) : expectedAmount;
  const finalPrice = promoInfo ? (promoInfo.finalAmount ?? expectedAmount) : expectedAmount;

  return (
    <dl className="space-y-3 rounded-xl border border-border bg-card p-3 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground">Course price</dt>
        <dd className="font-medium text-foreground">{formatCurrency(coursePrice, currency)}</dd>
      </div>
      {promoInfo && (
        <div className="flex items-center justify-between text-success">
          <dt>
            Promo (
            {promoLabel(promoInfo.code, promoInfo.discountType, promoInfo.discountValue, currency)})
          </dt>
          <dd>-{formatCurrency(promoInfo.discountAmount!, currency)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground">Expected amount</dt>
        <dd className="font-medium text-foreground">{formatCurrency(finalPrice, currency)}</dd>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <dt className="font-semibold text-foreground">Amount submitted</dt>
        <dd className="text-base font-bold text-brand">
          {formatCurrency(submittedAmount, currency)}
        </dd>
      </div>
    </dl>
  );
}
