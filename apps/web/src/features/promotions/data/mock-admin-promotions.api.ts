import { MOCK_COUPONS } from './mock-admin-promotions.data';
import type {
  Coupon,
  CouponDetail,
  CouponListParams,
  CouponListResult,
  CouponRedemption,
  CouponRedemptionListParams,
  CouponRedemptionListResult,
  CouponRules,
  CouponValidityStatus,
  CreateCouponInput,
  UpdateCouponInput,
} from '../types/admin-promotion.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

function randomCode(prefix?: string, suffix?: string): string {
  let random = '';
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    random += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  if (prefix) random = `${prefix}-${random}`;
  if (suffix) random = `${random}-${suffix}`;
  return random;
}

const couponStore: Coupon[] = MOCK_COUPONS.map((entry) => ({ ...entry }));
const ruleStore: Record<string, CouponRules> = {};

function computeValidityStatus(coupon: Coupon): CouponValidityStatus {
  const now = Date.now();
  if (coupon.status === 'REVOKED') return 'REVOKED';
  if (coupon.status === 'PAUSED') return 'INACTIVE';
  if (coupon.status === 'EXPIRED') return 'EXPIRED';
  if (coupon.validFrom && now < new Date(coupon.validFrom).getTime()) return 'NOT_STARTED';
  if (coupon.validUntil && now >= new Date(coupon.validUntil).getTime()) return 'EXPIRED';
  return 'ACTIVE';
}

function buildMockRedemptions(coupon: Coupon): CouponRedemption[] {
  const count = Math.min(coupon.redemptionCount, 120);
  const originalPrice = 49.99;
  const discount =
    coupon.discountType === 'FREE'
      ? originalPrice
      : coupon.discountType === 'PERCENTAGE'
        ? originalPrice * (Number(coupon.discountValue) / 100)
        : Number(coupon.discountValue);
  const finalPrice = Math.max(0, originalPrice - discount);
  const baseDate = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return Array.from({ length: count }, (_, index) => {
    const courseId = index % 2 === 0 ? 'course-1' : 'course-2';
    return {
      id: `redemption-${coupon.id}-${index + 1}`,
      status: 'CONFIRMED' as const,
      courseId,
      courseTitle:
        courseId === 'course-1' ? 'Modern React Development' : 'Introduction to Data Science',
      code: coupon.code,
      studentId: `student-${index + 1}`,
      studentEmail: `student${index + 1}@example.com`,
      studentFirstName: 'Test',
      studentLastName: `Student${index + 1}`,
      originalPrice: originalPrice.toFixed(2),
      discountAmount: discount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      currency: 'USD',
      redeemedAt: new Date(baseDate + index * 60 * 60 * 1000).toISOString(),
      enrollmentId: `enrollment-${index + 1}`,
      paymentId: index % 3 === 0 ? `payment-${index + 1}` : null,
      transactionId: index % 3 === 0 ? `TXN-${100000 + index}` : null,
    };
  });
}

export const mockAdminCouponsApi = {
  list: async (params: CouponListParams = {}): Promise<CouponListResult> => {
    const filtered = couponStore.filter((coupon) => {
      if (params.status && coupon.status !== params.status) return false;
      if (params.codeType && coupon.codeType !== params.codeType) return false;
      if (params.search && !coupon.code.toLowerCase().includes(params.search.toLowerCase()))
        return false;
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: filtered.slice(start, start + pageSize), total: filtered.length });
  },

  detail: async (couponId: string): Promise<CouponDetail> => {
    const coupon = couponStore.find((entry) => entry.id === couponId);
    if (!coupon) notFound('Coupon not found');
    return delay({
      ...coupon,
      validityStatus: computeValidityStatus(coupon),
      rules: ruleStore[couponId] ?? { courseIds: [], categoryIds: [], userIds: [] },
    });
  },

  redemptions: async (
    couponId: string,
    params: CouponRedemptionListParams = {},
  ): Promise<CouponRedemptionListResult> => {
    const coupon = couponStore.find((entry) => entry.id === couponId);
    if (!coupon) notFound('Coupon not found');
    let items = buildMockRedemptions(coupon);
    if (params.status) items = items.filter((entry) => entry.status === params.status);
    if (params.courseId) items = items.filter((entry) => entry.courseId === params.courseId);
    if (params.search) {
      const term = params.search.toLowerCase();
      items = items.filter(
        (entry) =>
          entry.studentEmail.toLowerCase().includes(term) ||
          entry.courseTitle.toLowerCase().includes(term) ||
          (entry.transactionId ?? '').toLowerCase().includes(term),
      );
    }
    if (params.from)
      items = items.filter((entry) => entry.redeemedAt >= new Date(params.from!).toISOString());
    if (params.to)
      items = items.filter((entry) => entry.redeemedAt <= new Date(params.to!).toISOString());
    items.sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt));
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: items.slice(start, start + pageSize), total: items.length });
  },

  create: async (input: CreateCouponInput): Promise<Coupon> => {
    const coupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: input.code?.trim() || randomCode(),
      codeType: input.codeType ?? 'MANUAL',
      status: input.status ?? 'ACTIVE',
      discountType: input.discountType ?? 'PERCENTAGE',
      discountValue: String(input.discountValue ?? 0),
      ownerUserId: input.ownerUserId ?? null,
      affiliateId: input.affiliateId ?? null,
      isSingleUse: input.isSingleUse ?? false,
      maxUsers: input.maxUsers ?? null,
      redemptionCount: 0,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      createdAt: new Date().toISOString(),
    };
    couponStore.push(coupon);
    ruleStore[coupon.id] = {
      courseIds: input.courseIds ?? [],
      categoryIds: input.categoryIds ?? [],
      userIds: input.userIds ?? [],
    };
    return delay(coupon);
  },

  update: async (couponId: string, input: UpdateCouponInput): Promise<Coupon> => {
    const coupon = couponStore.find((entry) => entry.id === couponId);
    if (!coupon) notFound('Coupon not found');
    if (input.status !== undefined) coupon.status = input.status;
    if (input.discountType !== undefined) coupon.discountType = input.discountType;
    if (input.discountValue !== undefined) coupon.discountValue = String(input.discountValue);
    if (input.isSingleUse !== undefined) coupon.isSingleUse = input.isSingleUse;
    if (input.maxUsers !== undefined) coupon.maxUsers = input.maxUsers;
    if (input.validFrom !== undefined) coupon.validFrom = input.validFrom;
    if (input.validUntil !== undefined) coupon.validUntil = input.validUntil;
    if (
      input.courseIds !== undefined ||
      input.categoryIds !== undefined ||
      input.userIds !== undefined
    ) {
      const current = ruleStore[couponId] ?? { courseIds: [], categoryIds: [], userIds: [] };
      ruleStore[couponId] = {
        courseIds: input.courseIds ?? current.courseIds,
        categoryIds: input.categoryIds ?? current.categoryIds,
        userIds: input.userIds ?? current.userIds,
      };
    }
    return delay(coupon);
  },

  archive: async (couponId: string): Promise<void> => {
    const coupon = couponStore.find((entry) => entry.id === couponId);
    if (!coupon) notFound('Coupon not found');
    coupon.status = 'REVOKED';
    return delay(undefined);
  },
};
