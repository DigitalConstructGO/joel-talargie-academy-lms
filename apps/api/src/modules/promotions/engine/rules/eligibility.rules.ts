import type {
  EngineRuleSet,
  PromotionInvalidReason,
  PromotionValidationInput,
} from '../../interfaces/promotion.interface';

/**
 * Every rule is a pure, independently-testable predicate: (ruleSet, input) => reason | null.
 * Adding a new eligibility dimension means adding one function here and
 * registering it in ELIGIBILITY_RULES below - no existing rule changes.
 */
export interface EligibilityRule {
  name: PromotionInvalidReason;
  check: (ruleSet: EngineRuleSet, input: PromotionValidationInput) => boolean;
}

export function isCodeActive(ruleSet: EngineRuleSet): boolean {
  return ruleSet.promoCode.status === 'ACTIVE';
}
export function isWithinCodeWindow(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const code = ruleSet.promoCode;
  if (code.validFrom && input.now < code.validFrom) return false;
  if (code.validUntil && input.now >= code.validUntil) return false;
  return true;
}
export function isUnderCodeUserLimit(ruleSet: EngineRuleSet): boolean {
  const code = ruleSet.promoCode;
  if (code.maxUsers === null) return true;
  // Students who already redeemed are already counted, so they never consume a
  // new slot - only a single-use code can stop them from redeeming again.
  if (ruleSet.userRedemptionCountForCode > 0) return true;
  return ruleSet.userCountForCode < code.maxUsers;
}
export function isCourseEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  return (
    ruleSet.courseRuleCourseIds.length === 0 ||
    ruleSet.courseRuleCourseIds.includes(input.course.id)
  );
}
export function isCategoryEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  return (
    ruleSet.categoryRuleCategoryIds.length === 0 ||
    ruleSet.categoryRuleCategoryIds.includes(input.course.categoryId)
  );
}
export function isUserEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  return (
    ruleSet.userRuleUserIds.length === 0 ||
    ruleSet.userRuleUserIds.includes(input.user.id)
  );
}
export function isNotDuplicateRedemption(ruleSet: EngineRuleSet): boolean {
  const code = ruleSet.promoCode;
  if (!code.isSingleUse) return true;
  return ruleSet.userRedemptionCountForCode < 1;
}

export const ELIGIBILITY_RULES: EligibilityRule[] = [
  { name: 'COUPON_INACTIVE', check: isCodeActive },
  { name: 'COUPON_EXPIRED', check: isWithinCodeWindow },
  { name: 'MAX_USERS_REACHED', check: isUnderCodeUserLimit },
  { name: 'DUPLICATE_REDEMPTION', check: isNotDuplicateRedemption },
  { name: 'COURSE_NOT_ELIGIBLE', check: isCourseEligible },
  { name: 'CATEGORY_NOT_ELIGIBLE', check: isCategoryEligible },
  { name: 'USER_NOT_ELIGIBLE', check: isUserEligible },
];
