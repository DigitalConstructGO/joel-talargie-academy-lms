import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminCampaignsApi } from '../data/mock-admin-promotions.api';
import type {
  Campaign,
  CampaignDetail,
  CampaignListParams,
  CampaignListResult,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../types/admin-promotion.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveAdminCampaignsApi = {
  list: async (params: CampaignListParams = {}) =>
    unwrap<CampaignListResult>(
      await authClient.get('/promotions', { params: cleanParams(params) }),
    ),

  detail: async (campaignId: string) =>
    unwrap<CampaignDetail>(await authClient.get(`/promotions/${encodeURIComponent(campaignId)}`)),

  create: async (input: CreateCampaignInput) =>
    unwrap<Campaign>(await authClient.post('/promotions', input)),

  update: async (campaignId: string, input: UpdateCampaignInput) =>
    unwrap<Campaign>(
      await authClient.patch(`/promotions/${encodeURIComponent(campaignId)}`, input),
    ),

  archive: async (campaignId: string) =>
    unwrap<void>(await authClient.delete(`/promotions/${encodeURIComponent(campaignId)}`)),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const adminCampaignsApi =
  CATALOG_DATA_SOURCE === 'live' ? liveAdminCampaignsApi : mockAdminCampaignsApi;
