export const PROMO_CAMPAIGN_TYPES = [
  'PERCENTAGE_DISCOUNT',
  'FIXED_DISCOUNT',
  'FREE_COURSE',
  'SCHOLARSHIP',
  'BUNDLE_DISCOUNT',
  'REFERRAL_REWARD',
  'AFFILIATE_DISCOUNT',
  'CORPORATE_DISCOUNT',
  'PARTNER_DISCOUNT',
  'EVENT_PROMOTION',
  'FLASH_SALE',
  'SEASONAL_PROMOTION',
  'FIRST_STUDENT_DISCOUNT',
  'BIRTHDAY_COUPON',
  'MANUAL_COUPON',
  'AUTOMATIC_PROMOTION',
] as const;
export type PromoCampaignType = (typeof PROMO_CAMPAIGN_TYPES)[number];

export const PROMO_CAMPAIGN_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'ARCHIVED',
] as const;
export type PromoCampaignStatus = (typeof PROMO_CAMPAIGN_STATUSES)[number];

export const PROMO_DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED', 'FREE'] as const;
export type PromoDiscountType = (typeof PROMO_DISCOUNT_TYPES)[number];

export const PROMO_CODE_TYPES = [
  'MANUAL',
  'REFERRAL',
  'AFFILIATE',
  'CORPORATE',
  'UNIVERSITY_PARTNER',
  'SYSTEM_GENERATED',
] as const;
export type PromoCodeType = (typeof PROMO_CODE_TYPES)[number];

export const PROMO_CODE_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'REVOKED',
] as const;
export type PromoCodeStatus = (typeof PROMO_CODE_STATUSES)[number];

export const PROMO_REDEMPTION_STATUSES = [
  'RESERVED',
  'CONFIRMED',
  'CANCELLED',
  'FAILED',
] as const;
export type PromoRedemptionStatus = (typeof PROMO_REDEMPTION_STATUSES)[number];

export const PROMO_AFFILIATE_STATUSES = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED',
] as const;
export type PromoAffiliateStatus = (typeof PROMO_AFFILIATE_STATUSES)[number];

/** Campaign types that never require a code - the engine auto-discovers them for a course. */
export const AUTOMATIC_CAMPAIGN_TYPES: readonly PromoCampaignType[] = [
  'AUTOMATIC_PROMOTION',
];

export const PROMO_USAGE_ACTIONS = [
  'CAMPAIGN_CREATED',
  'CAMPAIGN_UPDATED',
  'CAMPAIGN_ARCHIVED',
  'COUPON_GENERATED',
  'COUPON_UPDATED',
  'COUPON_ARCHIVED',
  'COUPON_REDEEMED',
  'COUPON_VALIDATION_FAILED',
  'COUPON_EXPIRED',
] as const;
export type PromoUsageAction = (typeof PROMO_USAGE_ACTIONS)[number];

export const COUPON_CODE_DEFAULT_LENGTH = 10;
export const COUPON_CODE_MIN_LENGTH = 4;
export const COUPON_CODE_MAX_LENGTH = 32;
export const COUPON_BULK_GENERATE_MAX = 500;

/** Visually-ambiguous characters excluded by default (0/O, 1/I/L, etc.). */
export const COUPON_CODE_AMBIGUOUS_CHARS = '0O1IL';
export const COUPON_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const REDEMPTION_VALIDATION_THROTTLE = { limit: 20, ttl: 60_000 };
export const REDEMPTION_THROTTLE = { limit: 10, ttl: 60_000 };
