import { MOCK_COUPONS } from './mock-admin-promotions.data';
import type {
  PromotionAnalyticsOverview,
  PromotionAnalyticsQueryParams,
} from '../types/admin-promotion.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const mockAdminPromotionAnalyticsApi = {
  overview: async (
    params: PromotionAnalyticsQueryParams = {},
  ): Promise<PromotionAnalyticsOverview> => {
    const limit = params.limit ?? 5;
    const active = MOCK_COUPONS.filter((coupon) => coupon.status === 'ACTIVE').length;
    const expired = MOCK_COUPONS.filter((coupon) => coupon.status === 'EXPIRED').length;
    const redeemed = MOCK_COUPONS.filter((coupon) => coupon.redemptionCount > 0).length;
    const totalRedemptions = MOCK_COUPONS.reduce(
      (sum, coupon) => sum + coupon.redemptionCount,
      0,
    );
    const topCodes = [...MOCK_COUPONS]
      .sort((a, b) => b.redemptionCount - a.redemptionCount)
      .slice(0, limit)
      .map((coupon) => ({
        codeId: coupon.id,
        code: coupon.code,
        redemptions: coupon.redemptionCount,
        revenue: (coupon.redemptionCount * 25).toFixed(2),
      }));
    return delay({
      codes: { active, expired, total: MOCK_COUPONS.length },
      coupons: {
        total: MOCK_COUPONS.length,
        redeemed,
        unused: MOCK_COUPONS.length - redeemed,
      },
      revenueGenerated: (totalRedemptions * 25).toFixed(2),
      discountGiven: (totalRedemptions * 8).toFixed(2),
      totalRedemptions,
      conversionRate: MOCK_COUPONS.length
        ? Number(((redeemed / MOCK_COUPONS.length) * 100).toFixed(2))
        : 0,
      topCodes,
    });
  },
};
