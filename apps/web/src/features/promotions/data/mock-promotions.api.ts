import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';
import type {
  PromotionValidationResult,
  RedeemCouponResult,
  ValidateCouponInput,
} from '../types/promotion.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** One working demo coupon - 15% off, any course. Everything else is a real "not found" outcome, not a fake pass-through. */
const MOCK_COUPON_CODE = 'WELCOME15';

function priceOf(courseId: string) {
  const record = MOCK_COURSE_RECORDS.find((course) => course.id === courseId);
  return Number(record?.discountPrice ?? record?.price ?? 0);
}

function evaluate(input: ValidateCouponInput): PromotionValidationResult {
  const originalPrice = priceOf(input.courseId);
  if (!input.code) {
    return {
      valid: false,
      reasonCode: 'COUPON_REQUIRED',
      message: 'Enter a promo code to continue',
      codeId: null,
      code: null,
      pricing: { originalPrice, discountAmount: 0, finalPrice: originalPrice, currency: 'USD' },
    };
  }
  if (input.code.trim().toUpperCase() !== MOCK_COUPON_CODE) {
    return {
      valid: false,
      reasonCode: 'COUPON_NOT_FOUND',
      message: 'This coupon code is invalid or has expired',
      codeId: null,
      code: input.code,
      pricing: { originalPrice, discountAmount: 0, finalPrice: originalPrice, currency: 'USD' },
    };
  }
  const discountAmount = Math.round(originalPrice * 0.15 * 100) / 100;
  return {
    valid: true,
    reasonCode: null,
    message: '15% welcome discount applied',
    codeId: 'mock-code-welcome15',
    code: MOCK_COUPON_CODE,
    pricing: {
      originalPrice,
      discountAmount,
      finalPrice: Math.max(0, originalPrice - discountAmount),
      currency: 'USD',
    },
  };
}

export const mockPromotionsApi = {
  validate: async (input: ValidateCouponInput): Promise<PromotionValidationResult> =>
    delay(evaluate(input)),

  redeem: async (input: ValidateCouponInput): Promise<RedeemCouponResult> => {
    const result = evaluate(input);
    if (!result.valid) {
      const error = new Error(result.message) as Error & {
        response?: { status: number; data: unknown };
      };
      error.response = {
        status: 422,
        data: { error: { code: result.reasonCode, message: result.message } },
      };
      throw error;
    }
    return delay({
      ...result,
      redemptionId: `redemption-${Date.now()}`,
      redemptionStatus: 'CONFIRMED',
      redeemedAt: new Date().toISOString(),
    });
  },
};
