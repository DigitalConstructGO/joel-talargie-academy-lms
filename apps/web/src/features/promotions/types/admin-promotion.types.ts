export type PromoDiscountType = 'PERCENTAGE' | 'FIXED' | 'FREE';
export type PromoCodeType =
  'MANUAL' | 'REFERRAL' | 'AFFILIATE' | 'CORPORATE' | 'UNIVERSITY_PARTNER' | 'SYSTEM_GENERATED';
export type PromoCodeStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'REVOKED';
export type PromoRedemptionStatus = 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
export type CouponValidityStatus = 'NOT_STARTED' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE' | 'REVOKED';

export interface Coupon {
  id: string;
  code: string;
  codeType: PromoCodeType;
  status: PromoCodeStatus;
  discountType: PromoDiscountType;
  discountValue: string;
  ownerUserId: string | null;
  affiliateId: string | null;
  isSingleUse: boolean;
  maxUsers: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

/**
 * Targeting rules resolved to their target ids. An empty courseIds and
 * categoryIds list means "all eligible courses".
 */
export interface CouponRules {
  courseIds: string[];
  categoryIds: string[];
  userIds: string[];
}

export interface CouponListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PromoCodeStatus;
  codeType?: PromoCodeType;
}

export interface CouponListResult {
  items: Coupon[];
  total: number;
}

export interface CreateCouponInput {
  code?: string;
  codeType?: PromoCodeType;
  status?: PromoCodeStatus;
  discountType?: PromoDiscountType;
  discountValue?: number;
  ownerUserId?: string;
  affiliateId?: string;
  isSingleUse?: boolean;
  maxUsers?: number;
  validFrom?: string;
  validUntil?: string;
  courseIds?: string[];
  categoryIds?: string[];
  userIds?: string[];
}

export interface UpdateCouponInput {
  status?: PromoCodeStatus;
  discountType?: PromoDiscountType;
  discountValue?: number;
  isSingleUse?: boolean;
  maxUsers?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  courseIds?: string[];
  categoryIds?: string[];
  userIds?: string[];
}

export interface CouponDetail extends Coupon {
  validityStatus: CouponValidityStatus;
  rules: CouponRules;
}

export interface CouponRedemption {
  id: string;
  status: PromoRedemptionStatus;
  courseId: string;
  courseTitle: string;
  code: string;
  studentId: string;
  studentEmail: string;
  studentFirstName: string | null;
  studentLastName: string | null;
  originalPrice: string;
  discountAmount: string;
  finalPrice: string;
  currency: string;
  redeemedAt: string;
  enrollmentId: string | null;
  paymentId: string | null;
  transactionId: string | null;
}

export interface CouponRedemptionListParams {
  page?: number;
  pageSize?: number;
  status?: PromoRedemptionStatus;
  courseId?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface CouponRedemptionListResult {
  items: CouponRedemption[];
  total: number;
}

export interface PromotionAnalyticsQueryParams {
  limit?: number;
}

export interface TopCodePerformance {
  codeId: string;
  code: string;
  redemptions: number;
  revenue: string;
}

export interface PromotionAnalyticsOverview {
  codes: { active: number; expired: number; total: number };
  coupons: { total: number; redeemed: number; unused: number };
  revenueGenerated: string;
  discountGiven: string;
  totalRedemptions: number;
  conversionRate: number;
  topCodes: TopCodePerformance[];
}
