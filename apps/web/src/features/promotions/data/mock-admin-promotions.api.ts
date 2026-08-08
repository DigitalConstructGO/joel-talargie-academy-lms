import { MOCK_CAMPAIGNS, MOCK_COUPONS } from './mock-admin-promotions.data';
import type {
  Campaign,
  CampaignDetail,
  CampaignListParams,
  CampaignListResult,
  Coupon,
  CouponListParams,
  CouponListResult,
  CreateCampaignInput,
  CreateCouponInput,
  GenerateCouponsInput,
  UpdateCampaignInput,
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

function randomCode(prefix?: string): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return prefix ? `${prefix}-${random}` : random;
}

const campaignStore: Campaign[] = MOCK_CAMPAIGNS.map((entry) => ({ ...entry }));
const couponStore: Coupon[] = MOCK_COUPONS.map((entry) => ({ ...entry }));

export const mockAdminCampaignsApi = {
  list: async (params: CampaignListParams = {}): Promise<CampaignListResult> => {
    const filtered = campaignStore.filter((campaign) => {
      if (params.status && campaign.status !== params.status) return false;
      if (params.type && campaign.type !== params.type) return false;
      if (params.isAutomatic !== undefined && campaign.isAutomatic !== params.isAutomatic)
        return false;
      if (params.search && !campaign.name.toLowerCase().includes(params.search.toLowerCase()))
        return false;
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: filtered.slice(start, start + pageSize), total: filtered.length });
  },

  detail: async (campaignId: string): Promise<CampaignDetail> => {
    const campaign = campaignStore.find((entry) => entry.id === campaignId);
    if (!campaign) notFound('Campaign not found');
    return delay({ ...campaign, rules: null });
  },

  create: async (input: CreateCampaignInput): Promise<Campaign> => {
    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      status: 'DRAFT',
      discountType: input.discountType,
      discountValue: String(input.discountValue),
      maxDiscountAmount: input.maxDiscountAmount != null ? String(input.maxDiscountAmount) : null,
      minimumPurchaseAmount:
        input.minimumPurchaseAmount != null ? String(input.minimumPurchaseAmount) : null,
      isAutomatic: input.isAutomatic ?? false,
      priority: input.priority ?? 0,
      startsAt: input.startsAt ?? new Date().toISOString(),
      endsAt: input.endsAt ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
      maxRedemptionsPerUser: input.maxRedemptionsPerUser ?? 1,
      redemptionCount: 0,
      requiresApproval: input.requiresApproval ?? false,
      totalSeats: null,
      seatsUsed: 0,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    campaignStore.push(campaign);
    return delay(campaign);
  },

  update: async (campaignId: string, input: UpdateCampaignInput): Promise<Campaign> => {
    const campaign = campaignStore.find((entry) => entry.id === campaignId);
    if (!campaign) notFound('Campaign not found');
    if (input.name !== undefined) campaign.name = input.name;
    if (input.description !== undefined) campaign.description = input.description ?? null;
    if (input.status !== undefined) campaign.status = input.status;
    if (input.discountType !== undefined) campaign.discountType = input.discountType;
    if (input.discountValue !== undefined) campaign.discountValue = String(input.discountValue);
    if (input.priority !== undefined) campaign.priority = input.priority;
    if (input.startsAt !== undefined) campaign.startsAt = input.startsAt;
    if (input.endsAt !== undefined) campaign.endsAt = input.endsAt;
    if (input.maxRedemptions !== undefined) campaign.maxRedemptions = input.maxRedemptions;
    if (input.maxRedemptionsPerUser !== undefined)
      campaign.maxRedemptionsPerUser = input.maxRedemptionsPerUser;
    if (input.requiresApproval !== undefined) campaign.requiresApproval = input.requiresApproval;
    campaign.updatedAt = new Date().toISOString();
    return delay(campaign);
  },

  archive: async (campaignId: string): Promise<void> => {
    const campaign = campaignStore.find((entry) => entry.id === campaignId);
    if (!campaign) notFound('Campaign not found');
    campaign.status = 'ARCHIVED';
    campaign.archivedAt = new Date().toISOString();
    return delay(undefined);
  },
};

export const mockAdminCouponsApi = {
  list: async (params: CouponListParams = {}): Promise<CouponListResult> => {
    const filtered = couponStore.filter((coupon) => {
      if (params.campaignId && coupon.campaignId !== params.campaignId) return false;
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

  create: async (input: CreateCouponInput): Promise<Coupon> => {
    const coupon: Coupon = {
      id: `coupon-${Date.now()}`,
      campaignId: input.campaignId,
      code: input.code?.trim() || randomCode(),
      codeType: input.codeType ?? 'MANUAL',
      status: 'ACTIVE',
      isSingleUse: input.isSingleUse ?? false,
      maxRedemptions: input.maxRedemptions ?? null,
      maxRedemptionsPerUser: input.maxRedemptionsPerUser ?? null,
      redemptionCount: 0,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      createdAt: new Date().toISOString(),
    };
    couponStore.push(coupon);
    return delay(coupon);
  },

  generate: async (input: GenerateCouponsInput): Promise<Coupon[]> => {
    const generated: Coupon[] = Array.from({ length: input.count }, () => ({
      id: `coupon-${Date.now()}-${Math.random()}`,
      campaignId: input.campaignId,
      code: randomCode(input.prefix),
      codeType: 'SYSTEM_GENERATED',
      status: 'ACTIVE',
      isSingleUse: input.isSingleUse ?? true,
      maxRedemptions: (input.isSingleUse ?? true) ? 1 : null,
      maxRedemptionsPerUser: 1,
      redemptionCount: 0,
      validFrom: null,
      validUntil: null,
      createdAt: new Date().toISOString(),
    }));
    couponStore.push(...generated);
    return delay(generated);
  },

  update: async (couponId: string, input: UpdateCouponInput): Promise<Coupon> => {
    const coupon = couponStore.find((entry) => entry.id === couponId);
    if (!coupon) notFound('Coupon not found');
    if (input.status !== undefined) coupon.status = input.status;
    if (input.maxRedemptions !== undefined) coupon.maxRedemptions = input.maxRedemptions;
    if (input.maxRedemptionsPerUser !== undefined)
      coupon.maxRedemptionsPerUser = input.maxRedemptionsPerUser;
    if (input.validFrom !== undefined) coupon.validFrom = input.validFrom;
    if (input.validUntil !== undefined) coupon.validUntil = input.validUntil;
    return delay(coupon);
  },

  archive: async (couponId: string): Promise<void> => {
    const coupon = couponStore.find((entry) => entry.id === couponId);
    if (!coupon) notFound('Coupon not found');
    coupon.status = 'REVOKED';
    return delay(undefined);
  },
};
