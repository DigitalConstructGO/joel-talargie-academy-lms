import { PromotionEngineService } from '../engine/promotion-engine.service';
import type {
  EngineRuleSet,
  PromotionValidationData,
  PromotionValidationInput,
} from '../interfaces/promotion.interface';

function ruleSet(
  overrides: Partial<EngineRuleSet['campaign']> = {},
  code: Partial<EngineRuleSet['promoCode']> | null = null,
): EngineRuleSet {
  return {
    campaign: {
      id: 'campaign-1',
      name: 'Test Campaign',
      type: 'MANUAL_COUPON',
      status: 'ACTIVE',
      discountType: 'PERCENTAGE',
      discountValue: '20',
      maxDiscountAmount: null,
      minimumPurchaseAmount: null,
      isAutomatic: false,
      priority: 0,
      startsAt: new Date('2020-01-01T00:00:00Z'),
      endsAt: null,
      maxRedemptions: null,
      maxRedemptionsPerUser: 1,
      redemptionCount: 0,
      allowedRoles: null,
      allowedCountries: null,
      allowedEmailDomains: null,
      allowedPaymentMethods: null,
      allowedDaysOfWeek: null,
      allowedHourStart: null,
      allowedHourEnd: null,
      newStudentsOnly: false,
      restrictToInstructorId: null,
      requiresApproval: false,
      totalSeats: null,
      seatsUsed: 0,
      archivedAt: null,
      ...overrides,
    },
    promoCode: code
      ? {
          id: 'code-1',
          campaignId: 'campaign-1',
          code: 'SAVE20',
          codeType: 'MANUAL',
          status: 'ACTIVE',
          ownerUserId: null,
          affiliateId: null,
          isSingleUse: false,
          maxRedemptions: null,
          maxRedemptionsPerUser: null,
          redemptionCount: 0,
          validFrom: null,
          validUntil: null,
          ...code,
        }
      : null,
    courseRuleCourseIds: [],
    categoryRuleCategoryIds: [],
    userRuleUserIds: [],
    userRedemptionCountForCode: 0,
    userRedemptionCountForCampaign: 0,
  };
}

function input(
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
    userIsNewStudent: false,
    ...overrides,
  };
}

describe('PromotionEngineService', () => {
  const engine = new PromotionEngineService();

  it('validates a correct coupon and returns computed pricing', () => {
    const data: PromotionValidationData = {
      requested: ruleSet({}, {}),
      automaticCandidates: [],
    };
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
    const data: PromotionValidationData = {
      requested: null,
      automaticCandidates: [],
    };
    const result = engine.evaluate(input({ code: 'NOPE' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COUPON_NOT_FOUND',
    });
  });

  it('rejects an expired campaign (Expired Coupon)', () => {
    const data: PromotionValidationData = {
      requested: ruleSet({ endsAt: new Date('2020-01-01') }, {}),
      automaticCandidates: [],
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'CAMPAIGN_EXPIRED',
    });
  });

  it('rejects re-redemption of an already-used code (Duplicate Coupon)', () => {
    // maxRedemptionsPerUser explicitly set above 1 isolates the dedicated
    // duplicate-redemption rule from the (also correct) per-user-limit rule,
    // which single-use codes would otherwise trip first.
    const data: PromotionValidationData = {
      requested: {
        ...ruleSet({}, { isSingleUse: true, maxRedemptionsPerUser: 5 }),
        userRedemptionCountForCode: 1,
      },
      automaticCandidates: [],
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'DUPLICATE_REDEMPTION',
    });
  });

  it('rejects a single-use code already redeemed once even without an explicit per-user override', () => {
    const data: PromotionValidationData = {
      requested: {
        ...ruleSet({}, { isSingleUse: true }),
        userRedemptionCountForCode: 1,
      },
      automaticCandidates: [],
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result.valid).toBe(false);
    expect(['DUPLICATE_REDEMPTION', 'PER_USER_LIMIT_REACHED']).toContain(
      result.reasonCode,
    );
  });

  it('rejects a course outside the campaign course rules (Course Restriction)', () => {
    const data: PromotionValidationData = {
      requested: { ...ruleSet({}, {}), courseRuleCourseIds: ['other-course'] },
      automaticCandidates: [],
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'COURSE_NOT_ELIGIBLE',
    });
  });

  it('rejects a role outside allowedRoles (Role Restriction)', () => {
    const data: PromotionValidationData = {
      requested: ruleSet({ allowedRoles: ['ADMINISTRATOR'] }, {}),
      automaticCandidates: [],
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'ROLE_NOT_ELIGIBLE',
    });
  });

  it('rejects a user outside the campaign user rules (User Restriction)', () => {
    const data: PromotionValidationData = {
      requested: { ...ruleSet({}, {}), userRuleUserIds: ['someone-else'] },
      automaticCandidates: [],
    };
    const result = engine.evaluate(input({ code: 'SAVE20' }), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'USER_NOT_ELIGIBLE',
    });
  });

  it('auto-discovers the highest-priority applicable automatic promotion when no code is given', () => {
    const low = ruleSet(
      { id: 'low', isAutomatic: true, priority: 1, discountValue: '5' },
      null,
    );
    const high = ruleSet(
      { id: 'high', isAutomatic: true, priority: 10, discountValue: '15' },
      null,
    );
    const data: PromotionValidationData = {
      requested: null,
      automaticCandidates: [low, high],
    };
    const result = engine.evaluate(input(), data);
    expect(result.valid).toBe(true);
    expect(result.campaignId).toBe('high');
    expect(result.pricing.discountAmount).toBe(15);
  });

  it('falls through to the next automatic candidate when the top-priority one is ineligible', () => {
    const ineligible = ruleSet(
      {
        id: 'ineligible',
        isAutomatic: true,
        priority: 10,
        allowedRoles: ['ADMINISTRATOR'],
      },
      null,
    );
    const eligible = ruleSet(
      { id: 'eligible', isAutomatic: true, priority: 1 },
      null,
    );
    const data: PromotionValidationData = {
      requested: null,
      automaticCandidates: [ineligible, eligible],
    };
    const result = engine.evaluate(input(), data);
    expect(result.valid).toBe(true);
    expect(result.campaignId).toBe('eligible');
  });

  it('returns NO_APPLICABLE_PROMOTION when nothing qualifies automatically', () => {
    const data: PromotionValidationData = {
      requested: null,
      automaticCandidates: [],
    };
    const result = engine.evaluate(input(), data);
    expect(result).toMatchObject({
      valid: false,
      reasonCode: 'NO_APPLICABLE_PROMOTION',
    });
    expect(result.pricing.finalPrice).toBe(100);
  });
});
