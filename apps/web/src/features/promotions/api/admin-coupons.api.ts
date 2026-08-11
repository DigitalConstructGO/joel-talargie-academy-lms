import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminCouponsApi } from '../data/mock-admin-promotions.api';
import type {
  Coupon,
  CouponListParams,
  CouponListResult,
  CreateCouponInput,
  GenerateCouponsInput,
  UpdateCouponInput,
} from '../types/admin-promotion.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveAdminCouponsApi = {
  list: async (params: CouponListParams = {}) =>
    unwrap<CouponListResult>(
      await authClient.get('/promotions/coupons', { params: cleanParams(params) }),
    ),

  create: async (input: CreateCouponInput) =>
    unwrap<Coupon>(await authClient.post('/promotions/coupons', input)),

  generate: async (input: GenerateCouponsInput) =>
    unwrap<Coupon[]>(await authClient.post('/promotions/generate', input)),

  update: async (couponId: string, input: UpdateCouponInput) =>
    unwrap<Coupon>(
      await authClient.patch(`/promotions/coupons/${encodeURIComponent(couponId)}`, input),
    ),

  archive: async (couponId: string) =>
    unwrap<void>(await authClient.delete(`/promotions/coupons/${encodeURIComponent(couponId)}`)),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const adminCouponsApi =
  CATALOG_DATA_SOURCE === 'live' ? liveAdminCouponsApi : mockAdminCouponsApi;
