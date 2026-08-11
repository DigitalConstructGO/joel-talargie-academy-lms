export type SettingCategory =
  | 'academy'
  | 'registration'
  | 'payment'
  | 'learning'
  | 'certificates'
  | 'notifications'
  | 'reports';

export type SettingType = 'STRING' | 'BOOLEAN' | 'INTEGER' | 'EMAIL' | 'ENUM' | 'UUID';

export interface PlatformSetting {
  key: string;
  category: SettingCategory;
  type: SettingType;
  defaultValue: unknown;
  permission: string;
  editable: boolean;
  restartRequired: boolean;
  description: string;
  value: unknown;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SettingsListParams {
  category?: SettingCategory;
  search?: string;
}

export interface UpdateSettingInput {
  value: unknown;
  reason: string;
}

export interface UpdateSettingsBatchInput {
  reason: string;
  items: { key: string; value: unknown }[];
}

export interface SettingHistoryEntry {
  id: string;
  previousValue: unknown;
  newValue: unknown;
  reason: string;
  actorId: string;
  createdAt: string;
}

export const SETTING_CATEGORY_LABELS: Record<SettingCategory, string> = {
  academy: 'Academy Information',
  registration: 'Registration',
  payment: 'Payment',
  learning: 'Learning',
  certificates: 'Certificates',
  notifications: 'Notifications',
  reports: 'Reports',
};
