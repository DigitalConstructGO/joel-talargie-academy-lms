import {
  isCategoryEligible,
  isCodeActive,
  isCourseEligible,
  isNotDuplicateRedemption,
  isUnderCodeUserLimit,
  isUserEligible,
  isWithinCodeWindow,
} from '../engine/rules/eligibility.rules';
import type {
  EngineRuleSet,
  PromotionValidationInput,
} from '../interfaces/promotion.interface';

function baseRuleSet(overrides: Partial<EngineRuleSet> = {}): EngineRuleSet {
  return {
    promoCode: {
      id: 'code-1',
      code: 'TEST10',
      codeType: 'MANUAL',
      status: 'ACTIVE',
      discountType: 'PERCENTAGE',
      discountValue: '10',
      ownerUserId: null,
      affiliateId: null,
      isSingleUse: false,
      maxUsers: null,
      redemptionCount: 0,
      validFrom: null,
      validUntil: null,
    },
    courseRuleCourseIds: [],
    categoryRuleCategoryIds: [],
    userRuleUserIds: [],
    userRedemptionCountForCode: 0,
    userCountForCode: 0,
    ...overrides,
  };
}

function withCode(
  overrides: Partial<EngineRuleSet['promoCode']> = {},
): EngineRuleSet {
  return {
    ...baseRuleSet(),
    promoCode: { ...baseRuleSet().promoCode, ...overrides },
  };
}

function baseInput(
  overrides: Partial<PromotionValidationInput> = {},
): PromotionValidationInput {
  return {
    user: { id: 'user-1', email: 'student@example.com', roles: ['STUDENT'] },
    course: {
      id: 'course-1',
      price: '100.00',
      currency: 'USD',
      categoryId: 'category-1',
      createdBy: 'instructor-1',
      status: 'PUBLISHED',
      accessType: 'PAID',
    },
    now: new Date('2024-06-15T12:00:00Z'),
    ...overrides,
  };
}

describe('eligibility rules', () => {
  it('isCodeActive rejects non-ACTIVE codes', () => {
    expect(isCodeActive(baseRuleSet())).toBe(true);
    expect(isCodeActive(withCode({ status: 'PAUSED' }))).toBe(false);
    expect(isCodeActive(withCode({ status: 'REVOKED' }))).toBe(false);
  });

  it('isWithinCodeWindow enforces the code validFrom/validUntil window', () => {
    const input = baseInput();
    expect(isWithinCodeWindow(baseRuleSet(), input)).toBe(true);
    const expired = withCode({ validUntil: new Date('2020-01-01') });
    expect(isWithinCodeWindow(expired, input)).toBe(false);
    const notYet = withCode({ validFrom: new Date('2099-01-01') });
    expect(isWithinCodeWindow(notYet, input)).toBe(false);
  });

  it('isUnderCodeUserLimit enforces the distinct-user cap (first N users)', () => {
    expect(isUnderCodeUserLimit(baseRuleSet())).toBe(true);
    const full = { ...withCode({ maxUsers: 50 }), userCountForCode: 50 };
    expect(isUnderCodeUserLimit(full)).toBe(false);
    const open = { ...withCode({ maxUsers: 50 }), userCountForCode: 49 };
    expect(isUnderCodeUserLimit(open)).toBe(true);
    // A student who already redeemed is counted in userCountForCode, so their
    // repeat redemption never consumes a fresh slot.
    const returning = {
      ...withCode({ maxUsers: 50 }),
      userCountForCode: 50,
      userRedemptionCountForCode: 1,
    };
    expect(isUnderCodeUserLimit(returning)).toBe(true);
  });

  it('enforces duplicate redemption for single-use codes', () => {
    const singleUsed = {
      ...withCode({ isSingleUse: true }),
      userRedemptionCountForCode: 1,
    };
    expect(isNotDuplicateRedemption(singleUsed)).toBe(false);
    const fresh = {
      ...withCode({ isSingleUse: true }),
      userRedemptionCountForCode: 0,
    };
    expect(isNotDuplicateRedemption(fresh)).toBe(true);
    const multiUse = {
      ...withCode({ isSingleUse: false }),
      userRedemptionCountForCode: 1,
    };
    expect(isNotDuplicateRedemption(multiUse)).toBe(true);
  });

  it('Course Restriction: rejects a course outside the code course rules', () => {
    const scoped = { ...baseRuleSet(), courseRuleCourseIds: ['other-course'] };
    expect(isCourseEligible(scoped, baseInput())).toBe(false);
    const unrestricted = baseRuleSet();
    expect(isCourseEligible(unrestricted, baseInput())).toBe(true);
    const included = { ...baseRuleSet(), courseRuleCourseIds: ['course-1'] };
    expect(isCourseEligible(included, baseInput())).toBe(true);
  });

  it('Category Restriction: rejects a category outside the code category rules', () => {
    const scoped = {
      ...baseRuleSet(),
      categoryRuleCategoryIds: ['other-category'],
    };
    expect(isCategoryEligible(scoped, baseInput())).toBe(false);
    const included = {
      ...baseRuleSet(),
      categoryRuleCategoryIds: ['category-1'],
    };
    expect(isCategoryEligible(included, baseInput())).toBe(true);
  });

  it('User Restriction: rejects a user not on the code allow-list', () => {
    const scoped = { ...baseRuleSet(), userRuleUserIds: ['someone-else'] };
    expect(isUserEligible(scoped, baseInput())).toBe(false);
    const allowed = { ...baseRuleSet(), userRuleUserIds: ['user-1'] };
    expect(isUserEligible(allowed, baseInput())).toBe(true);
  });
});
