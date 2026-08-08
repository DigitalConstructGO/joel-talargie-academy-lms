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

export interface EngineCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  discountType: string;
  discountValue: string;
  maxDiscountAmount: string | null;
  minimumPurchaseAmount: string | null;
  isAutomatic: boolean;
  priority: number;
  startsAt: Date;
  endsAt: Date | null;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number;
  redemptionCount: number;
  allowedRoles: string[] | null;
  allowedCountries: string[] | null;
  allowedEmailDomains: string[] | null;
  allowedPaymentMethods: string[] | null;
  allowedDaysOfWeek: number[] | null;
  allowedHourStart: number | null;
  allowedHourEnd: number | null;
  newStudentsOnly: boolean;
  restrictToInstructorId: string | null;
  requiresApproval: boolean;
  totalSeats: number | null;
  seatsUsed: number;
  archivedAt: Date | null;
}

export interface EngineCode {
  id: string;
  campaignId: string;
  code: string;
  codeType: string;
  status: string;
  ownerUserId: string | null;
  affiliateId: string | null;
  isSingleUse: boolean;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number | null;
  redemptionCount: number;
  validFrom: Date | null;
  validUntil: Date | null;
}

export interface EngineRuleSet {
  campaign: EngineCampaign;
  promoCode: EngineCode | null;
  courseRuleCourseIds: string[];
  categoryRuleCategoryIds: string[];
  userRuleUserIds: string[];
  userRedemptionCountForCode: number;
  userRedemptionCountForCampaign: number;
}

export interface PromotionValidationInput {
  user: EngineUser;
  course: EngineCourse;
  code?: string;
  country?: string;
  paymentMethod?: string;
  now: Date;
  userIsNewStudent: boolean;
}

/**
 * Everything the engine needs but can't compute itself, pre-fetched by the
 * repository layer. Keeping this as plain data (no DB handles) is what makes
 * the engine a pure function you can unit test without touching Postgres.
 */
export interface PromotionValidationData {
  requested: EngineRuleSet | null;
  automaticCandidates: EngineRuleSet[];
}

export type PromotionInvalidReason =
  | 'COUPON_REQUIRED'
  | 'COUPON_NOT_FOUND'
  | 'COUPON_INACTIVE'
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_INACTIVE'
  | 'CAMPAIGN_NOT_STARTED'
  | 'CAMPAIGN_EXPIRED'
  | 'COUPON_EXPIRED'
  | 'USAGE_LIMIT_REACHED'
  | 'PER_USER_LIMIT_REACHED'
  | 'COURSE_NOT_ELIGIBLE'
  | 'CATEGORY_NOT_ELIGIBLE'
  | 'USER_NOT_ELIGIBLE'
  | 'ROLE_NOT_ELIGIBLE'
  | 'COUNTRY_NOT_ELIGIBLE'
  | 'EMAIL_DOMAIN_NOT_ELIGIBLE'
  | 'INSTRUCTOR_NOT_ELIGIBLE'
  | 'NOT_NEW_STUDENT'
  | 'MINIMUM_PURCHASE_NOT_MET'
  | 'PAYMENT_METHOD_NOT_ELIGIBLE'
  | 'OUTSIDE_ALLOWED_DAYS'
  | 'OUTSIDE_ALLOWED_HOURS'
  | 'SEATS_EXHAUSTED'
  | 'DUPLICATE_REDEMPTION'
  | 'NO_APPLICABLE_PROMOTION';

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
  campaignId: string | null;
  campaignName: string | null;
  campaignType: string | null;
  codeId: string | null;
  code: string | null;
  pricing: PromotionPricing;
}
