import { MOCK_CAMPAIGNS, MOCK_COUPONS } from './mock-admin-promotions.data';
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
    const active = MOCK_CAMPAIGNS.filter((campaign) => campaign.status === 'ACTIVE').length;
    const expired = MOCK_CAMPAIGNS.filter((campaign) => campaign.status === 'EXPIRED').length;
    const redeemed = MOCK_COUPONS.filter((coupon) => coupon.redemptionCount > 0).length;
    const topCampaigns = [...MOCK_CAMPAIGNS]
      .sort((a, b) => b.redemptionCount - a.redemptionCount)
      .slice(0, limit)
      .map((campaign) => ({
        campaignId: campaign.id,
        campaignName: campaign.name,
        redemptions: campaign.redemptionCount,
        revenue: (campaign.redemptionCount * 25).toFixed(2),
      }));
    return delay({
      campaigns: { active, expired, total: MOCK_CAMPAIGNS.length },
      coupons: {
        total: MOCK_COUPONS.length,
        redeemed,
        unused: MOCK_COUPONS.length - redeemed,
      },
      revenueGenerated: (redeemed * 25).toFixed(2),
      discountGiven: (redeemed * 8).toFixed(2),
      totalRedemptions: redeemed,
      conversionRate: MOCK_COUPONS.length
        ? Number(((redeemed / MOCK_COUPONS.length) * 100).toFixed(2))
        : 0,
      topCampaigns,
    });
  },
};
