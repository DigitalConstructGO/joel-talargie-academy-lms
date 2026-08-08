export type PromoCampaignType =
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'FREE_COURSE'
  | 'SCHOLARSHIP'
  | 'BUNDLE_DISCOUNT'
  | 'REFERRAL_REWARD'
  | 'AFFILIATE_DISCOUNT'
  | 'CORPORATE_DISCOUNT'
  | 'PARTNER_DISCOUNT'
  | 'EVENT_PROMOTION'
  | 'FLASH_SALE'
  | 'SEASONAL_PROMOTION'
  | 'FIRST_STUDENT_DISCOUNT'
  | 'BIRTHDAY_COUPON'
  | 'MANUAL_COUPON'
  | 'AUTOMATIC_PROMOTION';

export type PromoCampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'ARCHIVED';
export type PromoDiscountType = 'PERCENTAGE' | 'FIXED' | 'FREE';
export type PromoCodeType =
  'MANUAL' | 'REFERRAL' | 'AFFILIATE' | 'CORPORATE' | 'UNIVERSITY_PARTNER' | 'SYSTEM_GENERATED';
export type PromoCodeStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'REVOKED';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: PromoCampaignType;
  status: PromoCampaignStatus;
  discountType: PromoDiscountType;
  discountValue: string;
  maxDiscountAmount: string | null;
  minimumPurchaseAmount: string | null;
  isAutomatic: boolean;
  priority: number;
  startsAt: string;
  endsAt: string | null;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number;
  redemptionCount: number;
  requiresApproval: boolean;
  totalSeats: number | null;
  seatsUsed: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDetail extends Campaign {
  rules: unknown;
}

export interface CampaignListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PromoCampaignStatus;
  type?: PromoCampaignType;
  isAutomatic?: boolean;
}

export interface CampaignListResult {
  items: Campaign[];
  total: number;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: PromoCampaignType;
  discountType: PromoDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minimumPurchaseAmount?: number;
  isAutomatic?: boolean;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;
  requiresApproval?: boolean;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  status?: PromoCampaignStatus;
  discountType?: PromoDiscountType;
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minimumPurchaseAmount?: number | null;
  priority?: number;
  startsAt?: string;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number;
  requiresApproval?: boolean;
}

export interface Coupon {
  id: string;
  campaignId: string;
  code: string;
  codeType: PromoCodeType;
  status: PromoCodeStatus;
  isSingleUse: boolean;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

export interface CouponListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  campaignId?: string;
  status?: PromoCodeStatus;
  codeType?: PromoCodeType;
}

export interface CouponListResult {
  items: Coupon[];
  total: number;
}

export interface CreateCouponInput {
  campaignId: string;
  code?: string;
  codeType?: PromoCodeType;
  isSingleUse?: boolean;
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface GenerateCouponsInput {
  campaignId: string;
  count: number;
  prefix?: string;
  isSingleUse?: boolean;
}

export interface UpdateCouponInput {
  status?: PromoCodeStatus;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface PromotionAnalyticsQueryParams {
  limit?: number;
}

export interface TopCampaignPerformance {
  campaignId: string;
  campaignName: string;
  redemptions: number;
  revenue: string;
}

export interface PromotionAnalyticsOverview {
  campaigns: { active: number; expired: number; total: number };
  coupons: { total: number; redeemed: number; unused: number };
  revenueGenerated: string;
  discountGiven: string;
  totalRedemptions: number;
  conversionRate: number;
  topCampaigns: TopCampaignPerformance[];
}
