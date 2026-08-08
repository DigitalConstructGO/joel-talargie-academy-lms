import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockSettingsApi } from '../data/mock-settings.api';
import type {
  PlatformSetting,
  SettingHistoryEntry,
  SettingsListParams,
  UpdateSettingsBatchInput,
} from '../types/settings.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveSettingsApi = {
  list: async (params: SettingsListParams = {}) =>
    unwrap<PlatformSetting[]>(
      await authClient.get('/admin/settings', { params: cleanParams(params) }),
    ),

  batch: async (input: UpdateSettingsBatchInput) =>
    unwrap<PlatformSetting[]>(await authClient.put('/admin/settings', input)),

  history: async (key: string) =>
    unwrap<SettingHistoryEntry[]>(
      await authClient.get(`/admin/settings/${encodeURIComponent(key)}/history`),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const settingsApi = CATALOG_DATA_SOURCE === 'live' ? liveSettingsApi : mockSettingsApi;
