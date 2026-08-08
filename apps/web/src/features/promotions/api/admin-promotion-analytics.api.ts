import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminPromotionAnalyticsApi } from '../data/mock-admin-promotion-analytics.api';
import type {
  PromotionAnalyticsOverview,
  PromotionAnalyticsQueryParams,
} from '../types/admin-promotion.types';

const liveAdminPromotionAnalyticsApi = {
  overview: async (params: PromotionAnalyticsQueryParams = {}) =>
    unwrap<PromotionAnalyticsOverview>(await authClient.get('/promotions/analytics', { params })),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const adminPromotionAnalyticsApi =
  CATALOG_DATA_SOURCE === 'live' ? liveAdminPromotionAnalyticsApi : mockAdminPromotionAnalyticsApi;
