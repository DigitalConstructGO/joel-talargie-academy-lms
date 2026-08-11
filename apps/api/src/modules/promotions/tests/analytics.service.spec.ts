import { PromotionAnalyticsService } from '../services/analytics.service';

describe('PromotionAnalyticsService', () => {
  const repository = {
    analyticsOverview: jest.fn(),
    topCampaigns: jest.fn(),
    topAffiliates: jest.fn(),
    topReferralCodes: jest.fn(),
  };
  const service = new PromotionAnalyticsService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('assembles the full analytics payload (Analytics)', async () => {
    repository.analyticsOverview.mockResolvedValue({
      campaigns: { active: 2, expired: 1, total: 3 },
      coupons: { total: 10, redeemed: 4, unused: 6 },
      revenueGenerated: '400.00',
      discountGiven: '80.00',
      totalRedemptions: 4,
      conversionRate: 40,
    });
    repository.topCampaigns.mockResolvedValue([
      { campaignId: 'c1', redemptions: 4 },
    ]);
    repository.topAffiliates.mockResolvedValue([
      { id: 'a1', totalRevenue: '400.00' },
    ]);
    repository.topReferralCodes.mockResolvedValue([
      { id: 'code-1', redemptionCount: 2 },
    ]);

    const result = await service.overview({ limit: 5 } as never);

    expect(repository.topCampaigns).toHaveBeenCalledWith(5);
    expect(result).toMatchObject({
      campaigns: { active: 2, expired: 1, total: 3 },
      totalRedemptions: 4,
      conversionRate: 40,
    });
    expect(result.topCampaigns).toHaveLength(1);
    expect(result.topAffiliates).toHaveLength(1);
    expect(result.topReferralCodes).toHaveLength(1);
  });

  it('defaults the top-N limit to 5 when not provided', async () => {
    repository.analyticsOverview.mockResolvedValue({
      campaigns: { active: 0, expired: 0, total: 0 },
      coupons: { total: 0, redeemed: 0, unused: 0 },
      revenueGenerated: '0',
      discountGiven: '0',
      totalRedemptions: 0,
      conversionRate: 0,
    });
    repository.topCampaigns.mockResolvedValue([]);
    repository.topAffiliates.mockResolvedValue([]);
    repository.topReferralCodes.mockResolvedValue([]);
    await service.overview({} as never);
    expect(repository.topCampaigns).toHaveBeenCalledWith(5);
  });
});
