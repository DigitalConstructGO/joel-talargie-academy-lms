import type {
  EngineCampaign,
  PromotionPricing,
} from '../../interfaces/promotion.interface';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Pure pricing math, isolated from eligibility. Always clamps: a discount can
 * never push the final price below 0, and can never exceed the original
 * price - covers "Prevent Negative Prices" and "Discount Greater Than Course
 * Price" from the validation requirements regardless of campaign misconfiguration.
 */
export function computePricing(
  campaign: Pick<
    EngineCampaign,
    'discountType' | 'discountValue' | 'maxDiscountAmount'
  >,
  coursePrice: string,
  currency: string,
): PromotionPricing {
  const originalPrice = round2(Number(coursePrice));
  let discountAmount: number;
  if (campaign.discountType === 'FREE') {
    discountAmount = originalPrice;
  } else if (campaign.discountType === 'PERCENTAGE') {
    discountAmount = round2(
      (originalPrice * Number(campaign.discountValue)) / 100,
    );
  } else {
    discountAmount = round2(Number(campaign.discountValue));
  }
  if (campaign.maxDiscountAmount !== null)
    discountAmount = Math.min(
      discountAmount,
      round2(Number(campaign.maxDiscountAmount)),
    );
  discountAmount = Math.min(Math.max(discountAmount, 0), originalPrice);
  const finalPrice = round2(originalPrice - discountAmount);
  return { originalPrice, discountAmount, finalPrice, currency };
}
