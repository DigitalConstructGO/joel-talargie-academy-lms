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
 * without Postgres. Support for a new promo code "type" never requires
 * touching this file: `codeType` is purely descriptive/analytics metadata on
 * the code row, while every actual behavior (discount math, eligibility) is
 * driven by the generic scalar/array rule columns on the code and the
 * pluggable rule list in engine/rules/eligibility.rules.ts.
 */
@Injectable()
export class PromotionEngineService {
  evaluate(
    input: PromotionValidationInput,
    data: PromotionValidationData,
  ): PromotionValidationResult {
    if (!input.code)
      return this.invalid(
        'COUPON_REQUIRED',
        describeReason('COUPON_REQUIRED', undefined),
        input,
      );
    if (!data.requested)
      return this.invalid(
        'COUPON_NOT_FOUND',
        describeReason('COUPON_NOT_FOUND', undefined),
        input,
      );
    return this.evaluateRuleSet(data.requested, input);
  }

  private evaluateRuleSet(
    ruleSet: EngineRuleSet,
    input: PromotionValidationInput,
  ): PromotionValidationResult {
    for (const rule of ELIGIBILITY_RULES) {
      if (!rule.check(ruleSet, input))
        return this.invalid(
          rule.name,
          describeReason(rule.name, ruleSet),
          input,
          ruleSet,
        );
    }
    const pricing = computePricing(
      ruleSet.promoCode,
      input.course.price,
      input.course.currency,
    );
    return {
      valid: true,
      reasonCode: null,
      message: 'Coupon is valid',
      codeId: ruleSet.promoCode.id,
      code: ruleSet.promoCode.code,
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
      codeId: ruleSet?.promoCode.id ?? null,
      code: ruleSet?.promoCode.code ?? input.code ?? null,
      pricing: {
        originalPrice: Number(input.course.price),
        discountAmount: 0,
        finalPrice: Number(input.course.price),
        currency: input.course.currency,
      },
    };
  }
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return '';
  return value.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * User-facing failure messages for the checkout promo-code step. The backend
 * is the source of truth for every message - the frontend renders whatever
 * comes back rather than composing its own text.
 */
function describeReason(
  reason: NonNullable<PromotionValidationResult['reasonCode']>,
  ruleSet?: EngineRuleSet,
): string {
  const code = ruleSet?.promoCode;
  const messages: Record<
    NonNullable<PromotionValidationResult['reasonCode']>,
    string
  > = {
    COUPON_REQUIRED: 'Enter a promo code to continue',
    COUPON_NOT_FOUND: 'Promo code is invalid.',
    COUPON_INACTIVE: 'This promo code is no longer active.',
    COUPON_EXPIRED: code?.validUntil
      ? `This promo code expired on ${formatDate(code.validUntil)}.`
      : 'This promo code has expired.',
    MAX_USERS_REACHED: code?.maxUsers
      ? `This promo code is limited to the first ${code.maxUsers} users.`
      : 'This promo code has reached its maximum number of users.',
    COURSE_NOT_ELIGIBLE: 'This promo code is not valid for this course.',
    CATEGORY_NOT_ELIGIBLE: 'This promo code is not valid for this course.',
    USER_NOT_ELIGIBLE: 'This promo code is not available for your account.',
    DUPLICATE_REDEMPTION: 'You have already used this promo code.',
  };
  return messages[reason];
}
