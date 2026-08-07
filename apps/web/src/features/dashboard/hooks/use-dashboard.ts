'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import type { DashboardOverviewParams } from '../types/dashboard.types';

export function useDashboardOverview(params: DashboardOverviewParams = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-overview', params] as const,
    queryFn: () => dashboardApi.overview(params),
  });
}
