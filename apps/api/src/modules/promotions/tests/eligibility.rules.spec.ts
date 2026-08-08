import {
  hasSeatsAvailable,
  isCampaignActive,
  isCategoryEligible,
  isCodeActive,
  isCountryEligible,
  isCourseEligible,
  isEmailDomainEligible,
  isInstructorEligible,
  isMinimumPurchaseMet,
  isNewStudentEligible,
  isNotDuplicateRedemption,
  isPaymentMethodEligible,
  isRoleEligible,
  isUnderCampaignPerUserLimit,
  isUnderCampaignUsageLimit,
  isUnderCodePerUserLimit,
  isUnderCodeUsageLimit,
  isUserEligible,
  isWithinAllowedDays,
  isWithinAllowedHours,
  isWithinCampaignWindow,
  isWithinCodeWindow,
} from '../engine/rules/eligibility.rules';
import type {
  EngineRuleSet,
  PromotionValidationInput,
} from '../interfaces/promotion.interface';

function baseRuleSet(
  overrides: Partial<EngineRuleSet['campaign']> = {},
): EngineRuleSet {
  return {
    campaign: {
      id: 'campaign-1',
      name: 'Test Campaign',
      type: 'PERCENTAGE_DISCOUNT',
      status: 'ACTIVE',
      discountType: 'PERCENTAGE',
      discountValue: '10',
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
    promoCode: null,
    courseRuleCourseIds: [],
    categoryRuleCategoryIds: [],
    userRuleUserIds: [],
    userRedemptionCountForCode: 0,
    userRedemptionCountForCampaign: 0,
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
    now: new Date('2024-06-15T12:00:00Z'), // a Saturday
    userIsNewStudent: false,
    ...overrides,
  };
}

describe('eligibility rules', () => {
  it('isCampaignActive rejects non-ACTIVE and archived campaigns', () => {
    expect(isCampaignActive(baseRuleSet())).toBe(true);
    expect(isCampaignActive(baseRuleSet({ status: 'PAUSED' }))).toBe(false);
    expect(isCampaignActive(baseRuleSet({ archivedAt: new Date() }))).toBe(
      false,
    );
  });

  it('isWithinCampaignWindow rejects a campaign that has not started or has ended', () => {
    const input = baseInput();
    expect(isWithinCampaignWindow(baseRuleSet(), input)).toBe(true);
    expect(
      isWithinCampaignWindow(
        baseRuleSet({ startsAt: new Date('2099-01-01') }),
        input,
      ),
    ).toBe(false);
    expect(
      isWithinCampaignWindow(
        baseRuleSet({ endsAt: new Date('2020-06-01') }),
        input,
      ),
    ).toBe(false);
  });

  it('isCodeActive passes when there is no code, rejects inactive codes', () => {
    expect(isCodeActive(baseRuleSet())).toBe(true);
    const withCode = {
      ...baseRuleSet(),
      promoCode: { ...emptyCode(), status: 'PAUSED' },
    };
    expect(isCodeActive(withCode)).toBe(false);
  });

  it('isWithinCodeWindow enforces the code validFrom/validUntil window', () => {
    const input = baseInput();
    const expired = {
      ...baseRuleSet(),
      promoCode: { ...emptyCode(), validUntil: new Date('2020-01-01') },
    };
    expect(isWithinCodeWindow(expired, input)).toBe(false);
    const notYet = {
      ...baseRuleSet(),
      promoCode: { ...emptyCode(), validFrom: new Date('2099-01-01') },
    };
    expect(isWithinCodeWindow(notYet, input)).toBe(false);
  });

  it('enforces campaign and code usage limits (Usage Limit)', () => {
    expect(
      isUnderCampaignUsageLimit(
        baseRuleSet({ maxRedemptions: 5, redemptionCount: 5 }),
      ),
    ).toBe(false);
    expect(
      isUnderCampaignUsageLimit(
        baseRuleSet({ maxRedemptions: 5, redemptionCount: 4 }),
      ),
    ).toBe(true);
    const codeExhausted = {
      ...baseRuleSet(),
      promoCode: { ...emptyCode(), maxRedemptions: 2, redemptionCount: 2 },
    };
    expect(isUnderCodeUsageLimit(codeExhausted)).toBe(false);
  });

  it('enforces per-user limits (Per User Uses / Duplicate Coupon prevention)', () => {
    const ruleSet = { ...baseRuleSet(), userRedemptionCountForCampaign: 1 };
    expect(isUnderCampaignPerUserLimit(ruleSet)).toBe(false);
    const single = {
      ...baseRuleSet(),
      promoCode: { ...emptyCode(), isSingleUse: true },
      userRedemptionCountForCode: 1,
    };
    expect(isUnderCodePerUserLimit(single)).toBe(false);
    expect(isNotDuplicateRedemption(single)).toBe(false);
  });

  it('Course Restriction: rejects a course outside the campaign course rules', () => {
    const ruleSet = { ...baseRuleSet(), courseRuleCourseIds: ['other-course'] };
    expect(isCourseEligible(ruleSet, baseInput())).toBe(false);
    const unrestricted = baseRuleSet();
    expect(isCourseEligible(unrestricted, baseInput())).toBe(true);
  });

  it('Category Restriction: rejects a category outside the campaign category rules', () => {
    const ruleSet = {
      ...baseRuleSet(),
      categoryRuleCategoryIds: ['other-category'],
    };
    expect(isCategoryEligible(ruleSet, baseInput())).toBe(false);
  });

  it('User Restriction: rejects a user not on the campaign allow-list', () => {
    const ruleSet = { ...baseRuleSet(), userRuleUserIds: ['someone-else'] };
    expect(isUserEligible(ruleSet, baseInput())).toBe(false);
    const allowed = { ...baseRuleSet(), userRuleUserIds: ['user-1'] };
    expect(isUserEligible(allowed, baseInput())).toBe(true);
  });

  it('Role Restriction: rejects a role not in allowedRoles', () => {
    const adminOnly = baseRuleSet({ allowedRoles: ['ADMINISTRATOR'] });
    expect(isRoleEligible(adminOnly, baseInput())).toBe(false);
    const studentOk = baseRuleSet({ allowedRoles: ['STUDENT'] });
    expect(isRoleEligible(studentOk, baseInput())).toBe(true);
  });

  it('Country Restriction requires a matching client-supplied country', () => {
    const usOnly = baseRuleSet({ allowedCountries: ['US'] });
    expect(isCountryEligible(usOnly, baseInput())).toBe(false);
    expect(isCountryEligible(usOnly, baseInput({ country: 'CA' }))).toBe(false);
    expect(isCountryEligible(usOnly, baseInput({ country: 'US' }))).toBe(true);
  });

  it('Email Domain Restriction matches the domain case-insensitively', () => {
    const corp = baseRuleSet({ allowedEmailDomains: ['Acme.com'] });
    expect(isEmailDomainEligible(corp, baseInput())).toBe(false);
    expect(
      isEmailDomainEligible(
        corp,
        baseInput({
          user: { id: 'u', email: 'person@ACME.com', roles: ['STUDENT'] },
        }),
      ),
    ).toBe(true);
  });

  it('Instructor Restriction matches the course creator', () => {
    const scoped = baseRuleSet({ restrictToInstructorId: 'someone-else' });
    expect(isInstructorEligible(scoped, baseInput())).toBe(false);
    const matching = baseRuleSet({ restrictToInstructorId: 'instructor-1' });
    expect(isInstructorEligible(matching, baseInput())).toBe(true);
  });

  it('First Student Discount: newStudentsOnly requires userIsNewStudent', () => {
    const scoped = baseRuleSet({ newStudentsOnly: true });
    expect(
      isNewStudentEligible(scoped, baseInput({ userIsNewStudent: false })),
    ).toBe(false);
    expect(
      isNewStudentEligible(scoped, baseInput({ userIsNewStudent: true })),
    ).toBe(true);
  });

  it('Minimum Purchase enforces the campaign floor against the course price', () => {
    const scoped = baseRuleSet({ minimumPurchaseAmount: '150' });
    expect(isMinimumPurchaseMet(scoped, baseInput())).toBe(false);
    expect(
      isMinimumPurchaseMet(
        scoped,
        baseInput({ course: { ...baseInput().course, price: '200' } }),
      ),
    ).toBe(true);
  });

  it('Payment Method restriction requires a matching client-supplied method', () => {
    const scoped = baseRuleSet({ allowedPaymentMethods: ['BANK_TRANSFER'] });
    expect(isPaymentMethodEligible(scoped, baseInput())).toBe(false);
    expect(
      isPaymentMethodEligible(
        scoped,
        baseInput({ paymentMethod: 'BANK_TRANSFER' }),
      ),
    ).toBe(true);
  });

  it('Specific Days restricts by UTC day of week', () => {
    const weekdaysOnly = baseRuleSet({ allowedDaysOfWeek: [1, 2, 3, 4, 5] });
    // 2024-06-15 is a Saturday (day 6)
    expect(isWithinAllowedDays(weekdaysOnly, baseInput())).toBe(false);
    expect(
      isWithinAllowedDays(
        weekdaysOnly,
        baseInput({ now: new Date('2024-06-17T12:00:00Z') }),
      ),
    ).toBe(true);
  });

  it('Specific Hours restricts by UTC hour, including overnight wraparound', () => {
    const businessHours = baseRuleSet({
      allowedHourStart: 9,
      allowedHourEnd: 17,
    });
    expect(
      isWithinAllowedHours(
        businessHours,
        baseInput({ now: new Date('2024-06-15T20:00:00Z') }),
      ),
    ).toBe(false);
    expect(
      isWithinAllowedHours(
        businessHours,
        baseInput({ now: new Date('2024-06-15T12:00:00Z') }),
      ),
    ).toBe(true);
    const overnight = baseRuleSet({ allowedHourStart: 22, allowedHourEnd: 2 });
    expect(
      isWithinAllowedHours(
        overnight,
        baseInput({ now: new Date('2024-06-15T23:00:00Z') }),
      ),
    ).toBe(true);
    expect(
      isWithinAllowedHours(
        overnight,
        baseInput({ now: new Date('2024-06-15T12:00:00Z') }),
      ),
    ).toBe(false);
  });

  it('Seats Exhausted: rejects when a scholarship has no seats remaining', () => {
    const full = baseRuleSet({ totalSeats: 10, seatsUsed: 10 });
    expect(hasSeatsAvailable(full)).toBe(false);
    const open = baseRuleSet({ totalSeats: 10, seatsUsed: 9 });
    expect(hasSeatsAvailable(open)).toBe(true);
  });
});

function emptyCode() {
  return {
    id: 'code-1',
    campaignId: 'campaign-1',
    code: 'TEST10',
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
  };
}
