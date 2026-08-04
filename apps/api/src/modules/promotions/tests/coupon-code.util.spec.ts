import {
  generateBulkCodes,
  generateSecureCode,
  normalizeCouponCode,
} from '../utils/coupon-code.util';
import { COUPON_CODE_AMBIGUOUS_CHARS } from '../constants/promotion.constants';

describe('normalizeCouponCode', () => {
  it('uppercases, trims, and strips internal whitespace', () => {
    expect(normalizeCouponCode('  save 20  ')).toBe('SAVE20');
  });
});

describe('generateSecureCode', () => {
  it('produces a code of the requested length by default', () => {
    const code = generateSecureCode({ length: 12 });
    expect(code).toHaveLength(12);
  });

  it('applies prefix and suffix', () => {
    const code = generateSecureCode({
      length: 6,
      prefix: 'summer',
      suffix: 'x',
    });
    expect(code.startsWith('SUMMER')).toBe(true);
    expect(code.endsWith('X')).toBe(true);
  });

  it('excludes visually-ambiguous characters by default', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateSecureCode({ length: 20 });
      for (const char of COUPON_CODE_AMBIGUOUS_CHARS)
        expect(code).not.toContain(char);
    }
  });

  it('allows ambiguous characters when explicitly requested', () => {
    let sawAmbiguous = false;
    for (let i = 0; i < 500 && !sawAmbiguous; i += 1) {
      const code = generateSecureCode({ length: 30, excludeAmbiguous: false });
      if ([...COUPON_CODE_AMBIGUOUS_CHARS].some((char) => code.includes(char)))
        sawAmbiguous = true;
    }
    expect(sawAmbiguous).toBe(true);
  });

  it('never produces the same code twice across many calls (collision-resistant)', () => {
    const codes = new Set(
      Array.from({ length: 1000 }, () => generateSecureCode({ length: 12 })),
    );
    expect(codes.size).toBe(1000);
  });
});

describe('generateBulkCodes', () => {
  it('generates the requested count of unique codes', () => {
    const codes = generateBulkCodes(50, { length: 8 });
    expect(codes).toHaveLength(50);
    expect(new Set(codes).size).toBe(50);
  });

  it('supports single-use style short batches with prefix', () => {
    const codes = generateBulkCodes(5, { length: 6, prefix: 'vip' });
    for (const code of codes) expect(code.startsWith('VIP')).toBe(true);
  });
});
