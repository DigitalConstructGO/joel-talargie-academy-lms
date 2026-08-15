import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  AcademyGeneralSettings,
  AcademyBrandingSettings,
  PlatformSetting,
  PublicLandingData,
  PublicSettings,
  SettingHistoryEntry,
  SettingsListParams,
  StructuredAcademySettings,
  UpdateSettingsBatchInput,
} from '../types/settings.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

export const settingsApi = {
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

  getStructured: async () =>
    unwrap<StructuredAcademySettings>(await authClient.get('/admin/settings/academy-structured')),

  getPublicLanding: async () =>
    unwrap<PublicLandingData>(await authClient.get('/public/landing')),

  getPublicAcademyInfo: async () =>
    unwrap<{
      general: AcademyGeneralSettings;
      branding: AcademyBrandingSettings;
      publicSettings: PublicSettings;
    }>(await authClient.get('/public/academy-info')),
};
