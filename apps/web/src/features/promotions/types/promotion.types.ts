export interface PromotionPricing {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  currency: string;
}

export interface PromotionValidationResult {
  valid: boolean;
  reasonCode: string | null;
  message: string;
  codeId: string | null;
  code: string | null;
  pricing: PromotionPricing;
}

export interface RedeemCouponResult extends PromotionValidationResult {
  redemptionId: string;
  redemptionStatus: string;
  redeemedAt: string | null;
}

export interface ValidateCouponInput {
  courseId: string;
  code?: string;
}
