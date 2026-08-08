import { MOCK_SETTINGS } from './mock-settings.data';
import type {
  PlatformSetting,
  SettingHistoryEntry,
  SettingsListParams,
  UpdateSettingsBatchInput,
} from '../types/settings.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const store: PlatformSetting[] = MOCK_SETTINGS.map((entry) => ({ ...entry }));
const historyStore: Record<string, SettingHistoryEntry[]> = {};

export const mockSettingsApi = {
  list: async (params: SettingsListParams = {}): Promise<PlatformSetting[]> => {
    const filtered = store.filter((entry) => {
      if (params.category && entry.category !== params.category) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (!entry.key.includes(needle) && !entry.description.toLowerCase().includes(needle))
          return false;
      }
      return true;
    });
    return delay(filtered);
  },

  batch: async (input: UpdateSettingsBatchInput): Promise<PlatformSetting[]> => {
    const updated: PlatformSetting[] = [];
    for (const item of input.items) {
      const setting = store.find((entry) => entry.key === item.key);
      if (!setting) continue;
      const previousValue = setting.value;
      setting.value = item.value;
      setting.updatedAt = new Date().toISOString();
      setting.updatedBy = 'user-5';
      updated.push(setting);
      historyStore[item.key] = [
        {
          id: `history-${Date.now()}-${item.key}`,
          previousValue,
          newValue: item.value,
          reason: input.reason,
          actorId: 'user-5',
          createdAt: new Date().toISOString(),
        },
        ...(historyStore[item.key] ?? []),
      ];
    }
    return delay(updated);
  },

  history: async (key: string): Promise<SettingHistoryEntry[]> => delay(historyStore[key] ?? []),
};
