export interface EngineCourse {
  id: string;
  price: string;
  currency: string;
  categoryId: string;
  createdBy: string;
  status: string;
  accessType: string;
}

export interface EngineUser {
  id: string;
  email: string;
  roles: string[];
}

export interface EngineCode {
  id: string;
  code: string;
  codeType: string;
  status: string;
  discountType: string;
  discountValue: string;
  ownerUserId: string | null;
  affiliateId: string | null;
  isSingleUse: boolean;
  maxUsers: number | null;
  redemptionCount: number;
  validFrom: Date | null;
  validUntil: Date | null;
}

export interface EngineRuleSet {
  promoCode: EngineCode;
  courseRuleCourseIds: string[];
  categoryRuleCategoryIds: string[];
  userRuleUserIds: string[];
  userRedemptionCountForCode: number;
  /** Distinct students who have already redeemed the code (first-N-users cap). */
  userCountForCode: number;
}

export interface PromotionValidationInput {
  user: EngineUser;
  course: EngineCourse;
  code?: string;
  now: Date;
}

/**
 * Everything the engine needs but can't compute itself, pre-fetched by the
 * repository layer. Keeping this as plain data (no DB handles) is what makes
 * the engine a pure function you can unit test without touching Postgres.
 */
export interface PromotionValidationData {
  requested: EngineRuleSet | null;
}

export type PromotionInvalidReason =
  | 'COUPON_REQUIRED'
  | 'COUPON_NOT_FOUND'
  | 'COUPON_INACTIVE'
  | 'COUPON_EXPIRED'
  | 'MAX_USERS_REACHED'
  | 'COURSE_NOT_ELIGIBLE'
  | 'CATEGORY_NOT_ELIGIBLE'
  | 'USER_NOT_ELIGIBLE'
  | 'DUPLICATE_REDEMPTION';

export interface PromotionPricing {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  currency: string;
}

export interface PromotionValidationResult {
  valid: boolean;
  reasonCode: PromotionInvalidReason | null;
  message: string;
  codeId: string | null;
  code: string | null;
  pricing: PromotionPricing;
}
