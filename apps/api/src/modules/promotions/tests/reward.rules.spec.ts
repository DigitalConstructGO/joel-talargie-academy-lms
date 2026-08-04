import {
  computeAffiliateCommission,
  computeReferrerReward,
} from '../engine/rules/reward.rules';

const pricing = {
  originalPrice: 200,
  discountAmount: 20,
  finalPrice: 180,
  currency: 'USD',
};

describe('computeReferrerReward', () => {
  it('computes a percentage reward off the final price', () => {
    expect(computeReferrerReward('PERCENTAGE', '10', pricing)).toBe(18);
  });
  it('computes a fixed reward', () => {
    expect(computeReferrerReward('FIXED', '25', pricing)).toBe(25);
  });
  it('returns null when no reward is configured', () => {
    expect(computeReferrerReward(null, null, pricing)).toBeNull();
  });
});

describe('computeAffiliateCommission', () => {
  it('computes a percentage commission off the final price', () => {
    expect(
      computeAffiliateCommission(
        {
          commissionType: 'PERCENTAGE',
          commissionRate: '15',
          commissionFixedAmount: null,
        },
        pricing,
      ),
    ).toBe(27);
  });
  it('computes a fixed commission', () => {
    expect(
      computeAffiliateCommission(
        {
          commissionType: 'FIXED',
          commissionRate: null,
          commissionFixedAmount: '5',
        },
        pricing,
      ),
    ).toBe(5);
  });
  it('returns 0 when commission configuration is incomplete', () => {
    expect(
      computeAffiliateCommission(
        {
          commissionType: 'PERCENTAGE',
          commissionRate: null,
          commissionFixedAmount: null,
        },
        pricing,
      ),
    ).toBe(0);
  });
});
