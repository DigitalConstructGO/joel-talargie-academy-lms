import type { PlatformSetting } from '../types/settings.types';

function setting(
  partial: Omit<
    PlatformSetting,
    | 'permission'
    | 'editable'
    | 'restartRequired'
    | 'description'
    | 'value'
    | 'updatedAt'
    | 'updatedBy'
  >,
): PlatformSetting {
  return {
    ...partial,
    permission: `settings.update_${partial.category}`,
    editable: true,
    restartRequired: false,
    description: partial.key.replace(/[._]/g, ' '),
    value: partial.defaultValue,
    updatedAt: null,
    updatedBy: null,
  };
}

export const MOCK_SETTINGS: PlatformSetting[] = [
  setting({
    key: 'academy.name',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'Joel Talargie Academy',
  }),
  setting({ key: 'academy.short_name', category: 'academy', type: 'STRING', defaultValue: 'JTA' }),
  setting({
    key: 'academy.support_email',
    category: 'academy',
    type: 'EMAIL',
    defaultValue: 'support@example.com',
  }),
  setting({ key: 'academy.support_phone', category: 'academy', type: 'STRING', defaultValue: '' }),
  setting({
    key: 'academy.timezone',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'Africa/Addis_Ababa',
  }),
  setting({
    key: 'academy.default_locale',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'en',
  }),
  setting({
    key: 'academy.default_currency',
    category: 'academy',
    type: 'ENUM',
    defaultValue: 'ETB',
  }),
  setting({
    key: 'registration.enabled',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'registration.require_email_verification',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'registration.allow_google_auth',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'payment.manual.enabled',
    category: 'payment',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({ key: 'payment.bank_name', category: 'payment', type: 'STRING', defaultValue: '' }),
  setting({ key: 'payment.account_name', category: 'payment', type: 'STRING', defaultValue: '' }),
  setting({ key: 'payment.account_number', category: 'payment', type: 'STRING', defaultValue: '' }),
  setting({
    key: 'payment.default_currency',
    category: 'payment',
    type: 'ENUM',
    defaultValue: 'ETB',
  }),
  setting({
    key: 'payment.receipt_max_size_mb',
    category: 'payment',
    type: 'INTEGER',
    defaultValue: 12,
  }),
  setting({
    key: 'learning.completed_review_access_enabled',
    category: 'learning',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'learning.video_position_update_interval_seconds',
    category: 'learning',
    type: 'INTEGER',
    defaultValue: 15,
  }),
  setting({
    key: 'certificates.generation_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'certificates.public_verification_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'notifications.email_enabled',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'notifications.in_app_enabled',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  }),
  setting({
    key: 'reports.default_timezone',
    category: 'reports',
    type: 'STRING',
    defaultValue: 'Africa/Addis_Ababa',
  }),
  setting({
    key: 'reports.maximum_export_rows',
    category: 'reports',
    type: 'INTEGER',
    defaultValue: 100000,
  }),
];
