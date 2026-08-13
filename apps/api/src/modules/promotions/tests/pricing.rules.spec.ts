import { computePricing } from '../engine/rules/pricing.rules';

describe('computePricing', () => {
  it('computes a percentage discount', () => {
    const result = computePricing(
      {
        discountType: 'PERCENTAGE',
        discountValue: '20',
      },
      '100.00',
      'USD',
    );
    expect(result).toEqual({
      originalPrice: 100,
      discountAmount: 20,
      finalPrice: 80,
      currency: 'USD',
    });
  });

  it('computes a fixed discount', () => {
    const result = computePricing(
      { discountType: 'FIXED', discountValue: '15' },
      '100.00',
      'USD',
    );
    expect(result).toMatchObject({ discountAmount: 15, finalPrice: 85 });
  });

  it('treats FREE as a 100% discount', () => {
    const result = computePricing(
      { discountType: 'FREE', discountValue: '0' },
      '249.99',
      'USD',
    );
    expect(result).toMatchObject({ discountAmount: 249.99, finalPrice: 0 });
  });

  it('never lets the discount exceed the original price (fixed discount larger than course price)', () => {
    const result = computePricing(
      { discountType: 'FIXED', discountValue: '500' },
      '100.00',
      'USD',
    );
    expect(result.discountAmount).toBe(100);
    expect(result.finalPrice).toBe(0);
  });

  it('never produces a negative final price', () => {
    const result = computePricing(
      {
        discountType: 'FIXED',
        discountValue: '99999',
      },
      '10.00',
      'USD',
    );
    expect(result.finalPrice).toBeGreaterThanOrEqual(0);
  });

  it('rounds to 2 decimal places', () => {
    const result = computePricing(
      {
        discountType: 'PERCENTAGE',
        discountValue: '33',
      },
      '19.99',
      'USD',
    );
    expect(result.discountAmount).toBe(6.6);
    expect(Number.isInteger(result.discountAmount * 100)).toBe(true);
  });
});
