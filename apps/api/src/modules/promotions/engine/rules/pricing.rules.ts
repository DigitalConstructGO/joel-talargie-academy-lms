import type {
  EngineCode,
  PromotionPricing,
} from '../../interfaces/promotion.interface';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Pure pricing math, isolated from eligibility. Always clamps: a discount can
 * never push the final price below 0, and can never exceed the original
 * price - covers "Prevent Negative Prices" and "Discount Greater Than Course
 * Price" from the validation requirements regardless of code misconfiguration.
 */
export function computePricing(
  code: Pick<EngineCode, 'discountType' | 'discountValue'>,
  coursePrice: string,
  currency: string,
): PromotionPricing {
  const originalPrice = round2(Number(coursePrice));
  let discountAmount: number;
  if (code.discountType === 'FREE') {
    discountAmount = originalPrice;
  } else if (code.discountType === 'PERCENTAGE') {
    discountAmount = round2(
      (originalPrice * Number(code.discountValue)) / 100,
    );
  } else {
    discountAmount = round2(Number(code.discountValue));
  }
  discountAmount = Math.min(Math.max(discountAmount, 0), originalPrice);
  const finalPrice = round2(originalPrice - discountAmount);
  return { originalPrice, discountAmount, finalPrice, currency };
}
