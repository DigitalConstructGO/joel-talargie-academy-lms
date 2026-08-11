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
  campaignId: string | null;
  campaignName: string | null;
  campaignType: string | null;
  codeId: string | null;
  code: string | null;
  pricing: PromotionPricing;
}

export interface RedeemCouponResult extends PromotionValidationResult {
  redemptionId: string;
  redemptionStatus: string;
  pendingApproval: boolean;
  redeemedAt: string | null;
}

export interface ValidateCouponInput {
  courseId: string;
  code?: string;
}
