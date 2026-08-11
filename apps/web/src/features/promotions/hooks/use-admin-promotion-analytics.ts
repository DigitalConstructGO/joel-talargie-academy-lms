'use client';

import { useQuery } from '@tanstack/react-query';
import { adminPromotionAnalyticsApi } from '../api/admin-promotion-analytics.api';
import type { PromotionAnalyticsQueryParams } from '../types/admin-promotion.types';

export function useAdminPromotionAnalytics(params: PromotionAnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin-promotion-analytics', params] as const,
    queryFn: () => adminPromotionAnalyticsApi.overview(params),
  });
}
