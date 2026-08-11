import { Injectable } from '@nestjs/common';
import { ELIGIBILITY_RULES } from './rules/eligibility.rules';
import { computePricing } from './rules/pricing.rules';
import type {
  EngineRuleSet,
  PromotionValidationData,
  PromotionValidationInput,
  PromotionValidationResult,
} from '../interfaces/promotion.interface';

/**
 * The reusable Promotion Engine. It is a pure function over its inputs - no
 * database access, no side effects - so every rule combination is testable
 * without Postgres. Support for a new promotion "type" never requires
 * touching this file: `type` is purely descriptive/analytics metadata on the
 * campaign row, while every actual behavior (discount math, eligibility) is
 * driven by the generic scalar/array rule columns already on the campaign
 * and the pluggable rule list in engine/rules/eligibility.rules.ts.
 */
@Injectable()
export class PromotionEngineService {
  evaluate(
    input: PromotionValidationInput,
    data: PromotionValidationData,
  ): PromotionValidationResult {
    if (input.code) return this.evaluateRequested(input, data);
    return this.evaluateAutomatic(input, data);
  }

  private evaluateRequested(
    input: PromotionValidationInput,
    data: PromotionValidationData,
  ): PromotionValidationResult {
    if (!data.requested)
      return this.invalid('COUPON_NOT_FOUND', 'Coupon code not found', input);
    return this.evaluateRuleSet(data.requested, input);
  }

  private evaluateAutomatic(
    input: PromotionValidationInput,
    data: PromotionValidationData,
  ): PromotionValidationResult {
    const ordered = [...data.automaticCandidates].sort(
      (a, b) => b.campaign.priority - a.campaign.priority,
    );
    for (const ruleSet of ordered) {
      const result = this.evaluateRuleSet(ruleSet, input);
      if (result.valid) return result;
    }
    return this.invalid(
      'NO_APPLICABLE_PROMOTION',
      'No automatic promotion applies to this course right now',
      input,
    );
  }

  private evaluateRuleSet(
    ruleSet: EngineRuleSet,
    input: PromotionValidationInput,
  ): PromotionValidationResult {
    for (const rule of ELIGIBILITY_RULES) {
      if (!rule.check(ruleSet, input))
        return this.invalid(
          rule.name,
          describeReason(rule.name),
          input,
          ruleSet,
        );
    }
    const pricing = computePricing(
      ruleSet.campaign,
      input.course.price,
      input.course.currency,
    );
    return {
      valid: true,
      reasonCode: null,
      message: 'Coupon is valid',
      campaignId: ruleSet.campaign.id,
      campaignName: ruleSet.campaign.name,
      campaignType: ruleSet.campaign.type,
      codeId: ruleSet.promoCode?.id ?? null,
      code: ruleSet.promoCode?.code ?? null,
      pricing,
    };
  }

  private invalid(
    reasonCode: PromotionValidationResult['reasonCode'],
    message: string,
    input: PromotionValidationInput,
    ruleSet?: EngineRuleSet,
  ): PromotionValidationResult {
    return {
      valid: false,
      reasonCode,
      message,
      campaignId: ruleSet?.campaign.id ?? null,
      campaignName: ruleSet?.campaign.name ?? null,
      campaignType: ruleSet?.campaign.type ?? null,
      codeId: ruleSet?.promoCode?.id ?? null,
      code: ruleSet?.promoCode?.code ?? input.code ?? null,
      pricing: {
        originalPrice: Number(input.course.price),
        discountAmount: 0,
        finalPrice: Number(input.course.price),
        currency: input.course.currency,
      },
    };
  }
}

function describeReason(
  reason: NonNullable<PromotionValidationResult['reasonCode']>,
): string {
  const messages: Record<
    NonNullable<PromotionValidationResult['reasonCode']>,
    string
  > = {
    COUPON_REQUIRED: 'A coupon code is required',
    COUPON_NOT_FOUND: 'Coupon code not found',
    COUPON_INACTIVE: 'This coupon is no longer active',
    CAMPAIGN_NOT_FOUND: 'Promotion campaign not found',
    CAMPAIGN_INACTIVE: 'This promotion is not currently active',
    CAMPAIGN_NOT_STARTED: 'This promotion has not started yet',
    CAMPAIGN_EXPIRED: 'This promotion has expired',
    COUPON_EXPIRED: 'This coupon has expired',
    USAGE_LIMIT_REACHED: 'This coupon has reached its usage limit',
    PER_USER_LIMIT_REACHED:
      'You have already used this coupon the maximum number of times',
    COURSE_NOT_ELIGIBLE: 'This coupon does not apply to this course',
    CATEGORY_NOT_ELIGIBLE: 'This coupon does not apply to this course category',
    USER_NOT_ELIGIBLE: 'This coupon is not available for your account',
    ROLE_NOT_ELIGIBLE: 'This coupon is not available for your account type',
    COUNTRY_NOT_ELIGIBLE: 'This coupon is not available in your country',
    EMAIL_DOMAIN_NOT_ELIGIBLE: 'This coupon requires a specific email domain',
    INSTRUCTOR_NOT_ELIGIBLE:
      'This coupon does not apply to this course instructor',
    NOT_NEW_STUDENT: 'This coupon is only available to new students',
    MINIMUM_PURCHASE_NOT_MET:
      'This course does not meet the minimum purchase amount',
    PAYMENT_METHOD_NOT_ELIGIBLE:
      'This coupon does not support the selected payment method',
    OUTSIDE_ALLOWED_DAYS: 'This coupon is not valid today',
    OUTSIDE_ALLOWED_HOURS: 'This coupon is not valid at this time',
    SEATS_EXHAUSTED: 'No seats remain for this promotion',
    DUPLICATE_REDEMPTION: 'This coupon has already been redeemed',
    NO_APPLICABLE_PROMOTION: 'No applicable promotion was found',
  };
  return messages[reason];
}
