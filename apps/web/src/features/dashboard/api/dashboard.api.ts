import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { MOCK_DASHBOARD_OVERVIEW } from '../data/mock-dashboard.data';
import type { DashboardOverview, DashboardOverviewParams } from '../types/dashboard.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const liveDashboardApi = {
  overview: async (params: DashboardOverviewParams = {}) =>
    unwrap<DashboardOverview>(await authClient.get('/admin/dashboard/overview', { params })),
};

const mockDashboardApi = {
  overview: async (_params: DashboardOverviewParams = {}) => delay(MOCK_DASHBOARD_OVERVIEW),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const dashboardApi = CATALOG_DATA_SOURCE === 'live' ? liveDashboardApi : mockDashboardApi;
