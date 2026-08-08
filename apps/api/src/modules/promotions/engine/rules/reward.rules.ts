import type { PromotionPricing } from '../../interfaces/promotion.interface';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Computes what the referrer earns, in the same currency as the redeemed course. */
export function computeReferrerReward(
  rewardType: string | null,
  rewardValue: string | null,
  pricing: PromotionPricing,
): number | null {
  if (!rewardType || rewardValue === null) return null;
  if (rewardType === 'PERCENTAGE')
    return round2((pricing.finalPrice * Number(rewardValue)) / 100);
  if (rewardType === 'FIXED') return round2(Number(rewardValue));
  return null;
}

export function computeAffiliateCommission(
  affiliate: {
    commissionType: string;
    commissionRate: string | null;
    commissionFixedAmount: string | null;
  },
  pricing: PromotionPricing,
): number {
  if (affiliate.commissionType === 'PERCENTAGE' && affiliate.commissionRate)
    return round2(
      (pricing.finalPrice * Number(affiliate.commissionRate)) / 100,
    );
  if (affiliate.commissionType === 'FIXED' && affiliate.commissionFixedAmount)
    return round2(Number(affiliate.commissionFixedAmount));
  return 0;
}
