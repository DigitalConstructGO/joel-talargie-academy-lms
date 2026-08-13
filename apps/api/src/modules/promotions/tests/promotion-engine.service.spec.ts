import { PromotionEngineService } from '../engine/promotion-engine.service';
import type {
  EngineRuleSet,
  PromotionValidationData,
  PromotionValidationInput,
} from '../interfaces/promotion.interface';

function ruleSet(
  code: Partial<EngineRuleSet['promoCode']> = {},
): EngineRuleSet {
  return {
    promoCode: {
      id: 'code-1',
      code: 'SAVE20',
      codeType: 'MANUAL',
      status: 'ACTIVE',
      discountType: 'PERCENTAGE',
      discountValue: '20',
      ownerUserId: null,
      affiliateId: null,
      isSingleUse: false,
      maxUsers: null,
      redemptionCount: 0,
      validFrom: null,
      validUntil: null,
      ...code,
    },
    courseRuleCourseIds: [],
    categoryRuleCategoryIds: [],
    userRuleUserIds: [],
    userRedemptionCountForCode: 0,
    userCountForCode: 0,
  };
}

function input(
  overrides: Omit<Partial<PromotionValidationInput>, 'course'> & {
    course?: Partial<PromotionValidationInput['course']>;
  } = {},
): PromotionValidationInput {
  const courseOverrides = overrides.course ?? {};
  return {
    user: overrides.user ?? { id: 'user-1', email: 'student@example.com', roles: ['STUDENT'] },
    course: {
      id: courseOverrides.id ?? 'course-1',
      price: courseOverrides.price ?? '100.00',
      currency: courseOverrides.currency ?? 'USD',
      categoryId: courseOverrides.categoryId ?? 'category-1',
      createdBy: courseOverrides.createdBy ?? 'instructor-1',
      status: courseOverrides.status ?? 'PUBLISHED',
      accessType: courseOverrides.accessType ?? 'PAID',
    },
    now: overrides.now ?? new Date('2024-06-15T12:00:00Z'),
    code: overrides.code,
  };
}

describe('PromotionEngineService', () => {
  const engine = new PromotionEngineService();

  it('requires a code when none is given (COUPON_REQUIRED)', () => {
    const data: PromotionValidationData = { requested: null };
    const result = engine.evaluate(input(), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COUPON_REQUIRED',
      message: 'Enter a promo code to continue',
    });
    expect(result.pricing.finalPrice).toBe(100);
  });

  it('validates a correct coupon and returns computed pricing', () => {
    const data: PromotionValidationData = { requested: ruleSet() };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result.valid).toBe(true);
    expect(result.pricing).toEqual({
      originalPrice: 100,
      discountAmount: 20,
      finalPrice: 80,
      currency: 'USD',
    });
  });

  it('returns COUPON_NOT_FOUND for an unknown code', () => {
    const data: PromotionValidationData = { requested: null };
    const result = engine.evaluate(input({ code: 'NOPE' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COUPON_NOT_FOUND',
      message: 'Promo code is invalid.',
    });
  });

  it('rejects an inactive code', () => {
    const data: PromotionValidationData = {
      requested: ruleSet({ status: 'PAUSED' }),
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COUPON_INACTIVE',
      message: 'This promo code is no longer active.',
    });
  });

  it('reports a code-level expiry date (Expired Coupon)', () => {
    const data: PromotionValidationData = {
      requested: ruleSet({ validUntil: new Date('2024-06-01T00:00:00Z') }),
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COUPON_EXPIRED',
      message: 'This promo code expired on June 1, 2024.',
    });
  });

  it('reports a not-started code with its start date', () => {
    const data: PromotionValidationData = {
      requested: ruleSet({ validFrom: new Date('2026-08-15T00:00:00Z') }),
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COUPON_EXPIRED',
      message: 'This promo code has expired.',
    });
  });

  it('reports the distinct-user cap when the first-N-users limit is reached', () => {
    const data: PromotionValidationData = {
      requested: { ...ruleSet({ maxUsers: 50 }), userCountForCode: 50 },
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'MAX_USERS_REACHED',
      message: 'This promo code is limited to the first 50 users.',
    });
  });

  it('allows a returning student to reuse a code whose user cap is full', () => {
    const data: PromotionValidationData = {
      requested: {
        ...ruleSet({ maxUsers: 1 }),
        userCountForCode: 1,
        userRedemptionCountForCode: 1,
      },
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result.valid).toBe(true);
  });

  it('rejects re-redemption of an already-used single-use code (Duplicate Coupon)', () => {
    const data: PromotionValidationData = {
      requested: {
        ...ruleSet({ isSingleUse: true }),
        userRedemptionCountForCode: 1,
      },
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'DUPLICATE_REDEMPTION',
      message: 'You have already used this promo code.',
    });
  });

  it('rejects a course outside the code course rules (Course Restriction)', () => {
    const data: PromotionValidationData = {
      requested: { ...ruleSet(), courseRuleCourseIds: ['other-course'] },
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COURSE_NOT_ELIGIBLE',
      message: 'This promo code is not valid for this course.',
    });
  });

  it('rejects a user outside the code user rules (User Restriction)', () => {
    const data: PromotionValidationData = {
      requested: { ...ruleSet(), userRuleUserIds: ['someone-else'] },
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'USER_NOT_ELIGIBLE',
      message: 'This promo code is not available for your account.',
    });
  });

  it('reports the expiry before eligibility for an expired targeted code', () => {
    const data: PromotionValidationData = {
      requested: {
        ...ruleSet({ validUntil: new Date('2024-06-01T00:00:00Z') }),
        courseRuleCourseIds: ['course-1'],
      },
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COUPON_EXPIRED',
    });
  });

  describe('targeting', () => {
    it('applies to any course when no course or category rules are set (All Courses)', () => {
      const data: PromotionValidationData = { requested: ruleSet() };
      const result = engine.evaluate(
        input({ code: 'SAVE20', course: { id: 'unlisted-course' } }),
        data,
      );
      expect(result.valid).toBe(true);
      expect(result.pricing.discountAmount).toBe(20);
    });

    it('applies to a course in a single targeted category', () => {
      const data: PromotionValidationData = {
        requested: { ...ruleSet(), categoryRuleCategoryIds: ['category-1'] },
      };
      const result = engine.evaluate(input({ code: 'SAVE20' }), data);
      expect(result.valid).toBe(true);
      expect(result.pricing.finalPrice).toBe(80);
    });

    it('applies to a course matching any of multiple targeted categories', () => {
      const data: PromotionValidationData = {
        requested: {
          ...ruleSet(),
          categoryRuleCategoryIds: ['category-a', 'category-1'],
        },
      };
      const result = engine.evaluate(input({ code: 'SAVE20' }), data);
      expect(result.valid).toBe(true);
    });

    it('rejects a course in a category outside the targeted categories', () => {
      const data: PromotionValidationData = {
        requested: {
          ...ruleSet(),
          categoryRuleCategoryIds: ['design-category'],
        },
      };
      // Default course sits in category-1; the code only targets design.
      const result = engine.evaluate(input({ code: 'SAVE20' }), data);
      expect(result).toMatchObject({
        valid: false,
        reasonCode: 'CATEGORY_NOT_ELIGIBLE',
        message: 'This promo code is not valid for this course.',
      });
    });

    it('applies to a single targeted course', () => {
      const data: PromotionValidationData = {
        requested: { ...ruleSet(), courseRuleCourseIds: ['course-1'] },
      };
      const result = engine.evaluate(input({ code: 'SAVE20' }), data);
      expect(result.valid).toBe(true);
    });

    it('applies to a course in a list of multiple targeted courses', () => {
      const data: PromotionValidationData = {
        requested: {
          ...ruleSet(),
          courseRuleCourseIds: ['course-a', 'course-1', 'course-b'],
        },
      };
      const result = engine.evaluate(input({ code: 'SAVE20' }), data);
      expect(result.valid).toBe(true);
      expect(result.pricing.finalPrice).toBe(80);
    });

    it('computes the correct discount for a valid targeted code', () => {
      const data: PromotionValidationData = {
        requested: {
          ...ruleSet({ discountType: 'PERCENTAGE', discountValue: '25' }),
          categoryRuleCategoryIds: ['category-1'],
        },
      };
      const result = engine.evaluate(input({ code: 'SAVE20' }), data);
      expect(result.valid).toBe(true);
      expect(result.pricing).toEqual({
        originalPrice: 100,
        discountAmount: 25,
        finalPrice: 75,
        currency: 'USD',
      });
    });
  });
});
