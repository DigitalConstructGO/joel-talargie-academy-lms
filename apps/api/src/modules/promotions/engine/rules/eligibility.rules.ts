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

export function isCampaignActive(ruleSet: EngineRuleSet): boolean {
  return ruleSet.campaign.status === 'ACTIVE' && !ruleSet.campaign.archivedAt;
}
export function isWithinCampaignWindow(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const { startsAt, endsAt } = ruleSet.campaign;
  return input.now >= startsAt && (endsAt === null || input.now < endsAt);
}
export function isCodeActive(ruleSet: EngineRuleSet): boolean {
  return !ruleSet.promoCode || ruleSet.promoCode.status === 'ACTIVE';
}
export function isWithinCodeWindow(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const code = ruleSet.promoCode;
  if (!code) return true;
  if (code.validFrom && input.now < code.validFrom) return false;
  if (code.validUntil && input.now >= code.validUntil) return false;
  return true;
}
export function isUnderCampaignUsageLimit(ruleSet: EngineRuleSet): boolean {
  const { maxRedemptions, redemptionCount } = ruleSet.campaign;
  return maxRedemptions === null || redemptionCount < maxRedemptions;
}
export function isUnderCodeUsageLimit(ruleSet: EngineRuleSet): boolean {
  const code = ruleSet.promoCode;
  if (!code || code.maxRedemptions === null) return true;
  return code.redemptionCount < code.maxRedemptions;
}
export function isUnderCampaignPerUserLimit(ruleSet: EngineRuleSet): boolean {
  return (
    ruleSet.userRedemptionCountForCampaign <
    ruleSet.campaign.maxRedemptionsPerUser
  );
}
export function isUnderCodePerUserLimit(ruleSet: EngineRuleSet): boolean {
  const code = ruleSet.promoCode;
  if (!code) return true;
  const limit = code.maxRedemptionsPerUser ?? (code.isSingleUse ? 1 : null);
  return limit === null || ruleSet.userRedemptionCountForCode < limit;
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
export function isRoleEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const roles = ruleSet.campaign.allowedRoles;
  return (
    !roles?.length || input.user.roles.some((role) => roles.includes(role))
  );
}
export function isCountryEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const countries = ruleSet.campaign.allowedCountries;
  return (
    !countries?.length || (!!input.country && countries.includes(input.country))
  );
}
export function isEmailDomainEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const domains = ruleSet.campaign.allowedEmailDomains;
  if (!domains?.length) return true;
  const domain = input.user.email.split('@')[1]?.toLowerCase();
  return (
    !!domain && domains.some((allowed) => allowed.toLowerCase() === domain)
  );
}
export function isInstructorEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const instructorId = ruleSet.campaign.restrictToInstructorId;
  return !instructorId || input.course.createdBy === instructorId;
}
export function isNewStudentEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  return !ruleSet.campaign.newStudentsOnly || input.userIsNewStudent;
}
export function isMinimumPurchaseMet(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const minimum = ruleSet.campaign.minimumPurchaseAmount;
  return minimum === null || Number(input.course.price) >= Number(minimum);
}
export function isPaymentMethodEligible(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const methods = ruleSet.campaign.allowedPaymentMethods;
  return (
    !methods?.length ||
    (!!input.paymentMethod && methods.includes(input.paymentMethod))
  );
}
export function isWithinAllowedDays(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const days = ruleSet.campaign.allowedDaysOfWeek;
  return !days?.length || days.includes(input.now.getUTCDay());
}
export function isWithinAllowedHours(
  ruleSet: EngineRuleSet,
  input: PromotionValidationInput,
): boolean {
  const { allowedHourStart, allowedHourEnd } = ruleSet.campaign;
  if (allowedHourStart === null || allowedHourEnd === null) return true;
  const hour = input.now.getUTCHours();
  return allowedHourStart <= allowedHourEnd
    ? hour >= allowedHourStart && hour <= allowedHourEnd
    : hour >= allowedHourStart || hour <= allowedHourEnd;
}
export function hasSeatsAvailable(ruleSet: EngineRuleSet): boolean {
  const { totalSeats, seatsUsed } = ruleSet.campaign;
  return totalSeats === null || seatsUsed < totalSeats;
}
export function isNotDuplicateRedemption(ruleSet: EngineRuleSet): boolean {
  const code = ruleSet.promoCode;
  if (!code?.isSingleUse) return true;
  return ruleSet.userRedemptionCountForCode < 1;
}

export const ELIGIBILITY_RULES: EligibilityRule[] = [
  { name: 'CAMPAIGN_INACTIVE', check: isCampaignActive },
  { name: 'CAMPAIGN_EXPIRED', check: isWithinCampaignWindow },
  { name: 'COUPON_INACTIVE', check: isCodeActive },
  { name: 'COUPON_EXPIRED', check: isWithinCodeWindow },
  { name: 'USAGE_LIMIT_REACHED', check: isUnderCampaignUsageLimit },
  { name: 'USAGE_LIMIT_REACHED', check: isUnderCodeUsageLimit },
  { name: 'PER_USER_LIMIT_REACHED', check: isUnderCampaignPerUserLimit },
  { name: 'PER_USER_LIMIT_REACHED', check: isUnderCodePerUserLimit },
  { name: 'DUPLICATE_REDEMPTION', check: isNotDuplicateRedemption },
  { name: 'COURSE_NOT_ELIGIBLE', check: isCourseEligible },
  { name: 'CATEGORY_NOT_ELIGIBLE', check: isCategoryEligible },
  { name: 'USER_NOT_ELIGIBLE', check: isUserEligible },
  { name: 'ROLE_NOT_ELIGIBLE', check: isRoleEligible },
  { name: 'COUNTRY_NOT_ELIGIBLE', check: isCountryEligible },
  { name: 'EMAIL_DOMAIN_NOT_ELIGIBLE', check: isEmailDomainEligible },
  { name: 'INSTRUCTOR_NOT_ELIGIBLE', check: isInstructorEligible },
  { name: 'NOT_NEW_STUDENT', check: isNewStudentEligible },
  { name: 'MINIMUM_PURCHASE_NOT_MET', check: isMinimumPurchaseMet },
  { name: 'PAYMENT_METHOD_NOT_ELIGIBLE', check: isPaymentMethodEligible },
  { name: 'OUTSIDE_ALLOWED_DAYS', check: isWithinAllowedDays },
  { name: 'OUTSIDE_ALLOWED_HOURS', check: isWithinAllowedHours },
  { name: 'SEATS_EXHAUSTED', check: hasSeatsAvailable },
];
