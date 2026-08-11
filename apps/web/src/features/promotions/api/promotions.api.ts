import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockPromotionsApi } from '../data/mock-promotions.api';
import type {
  PromotionValidationResult,
  RedeemCouponResult,
  ValidateCouponInput,
} from '../types/promotion.types';

/** Talks to the real backend's authenticated `/promotions` endpoints. */
const livePromotionsApi = {
  validate: async (input: ValidateCouponInput) =>
    unwrap<PromotionValidationResult>(await authClient.post('/promotions/validate', input)),

  redeem: async (input: ValidateCouponInput) =>
    unwrap<RedeemCouponResult>(await authClient.post('/promotions/redeem', input)),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const promotionsApi = CATALOG_DATA_SOURCE === 'live' ? livePromotionsApi : mockPromotionsApi;
