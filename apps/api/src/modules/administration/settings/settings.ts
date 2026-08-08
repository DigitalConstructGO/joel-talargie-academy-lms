import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
export type SettingCategory =
  | 'academy'
  | 'registration'
  | 'payment'
  | 'learning'
  | 'certificates'
  | 'notifications'
  | 'reports';
export interface SettingDefinition {
  key: string;
  category: SettingCategory;
  type: 'STRING' | 'BOOLEAN' | 'INTEGER' | 'EMAIL' | 'ENUM' | 'UUID';
  defaultValue: unknown;
  permission: string;
  editable: boolean;
  restartRequired: boolean;
  description: string;
}
const defs: (Omit<
  SettingDefinition,
  'permission' | 'editable' | 'restartRequired' | 'description'
> &
  Partial<SettingDefinition>)[] = [
  {
    key: 'academy.name',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'Joel Talargie Academy',
  },
  {
    key: 'academy.short_name',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'JTA',
  },
  {
    key: 'academy.support_email',
    category: 'academy',
    type: 'EMAIL',
    defaultValue: 'support@example.com',
  },
  {
    key: 'academy.support_phone',
    category: 'academy',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'academy.timezone',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'Africa/Addis_Ababa',
  },
  {
    key: 'academy.default_locale',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'en',
  },
  {
    key: 'academy.default_currency',
    category: 'academy',
    type: 'ENUM',
    defaultValue: 'ETB',
  },
  {
    key: 'registration.enabled',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'registration.require_email_verification',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'registration.allow_google_auth',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'registration.default_student_role_code',
    category: 'registration',
    type: 'STRING',
    defaultValue: 'STUDENT',
  },
  {
    key: 'payment.manual.enabled',
    category: 'payment',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'payment.bank_name',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.account_name',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.account_number',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.branch',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.reference_instructions',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.general_instructions',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.default_currency',
    category: 'payment',
    type: 'ENUM',
    defaultValue: 'ETB',
  },
  {
    key: 'payment.receipt_max_size_mb',
    category: 'payment',
    type: 'INTEGER',
    defaultValue: 10,
  },
  {
    key: 'payment.support_contact',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'learning.completed_review_access_enabled',
    category: 'learning',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'learning.video_position_update_interval_seconds',
    category: 'learning',
    type: 'INTEGER',
    defaultValue: 15,
  },
  {
    key: 'learning.require_published_mandatory_lesson',
    category: 'learning',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'certificates.generation_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'certificates.default_template_id',
    category: 'certificates',
    type: 'UUID',
    defaultValue: null,
  },
  {
    key: 'certificates.student_download_revoked_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: false,
  },
  {
    key: 'certificates.public_verification_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.email_enabled',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.in_app_enabled',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.default_learning_email',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.default_payment_email',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.default_certificate_email',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'reports.default_timezone',
    category: 'reports',
    type: 'STRING',
    defaultValue: 'Africa/Addis_Ababa',
  },
  {
    key: 'reports.default_page_size',
    category: 'reports',
    type: 'INTEGER',
    defaultValue: 25,
  },
  {
    key: 'reports.maximum_export_rows',
    category: 'reports',
    type: 'INTEGER',
    defaultValue: 100000,
  },
  {
    key: 'reports.export_retention_days',
    category: 'reports',
    type: 'INTEGER',
    defaultValue: 30,
  },
];
@Injectable()
export class SettingRegistryService {
  readonly definitions: SettingDefinition[] = defs.map((d) => ({
    ...d,
    permission: d.permission ?? `settings.update_${d.category}`,
    editable: d.editable ?? true,
    restartRequired: d.restartRequired ?? false,
    description: d.description ?? d.key.replace(/[._]/g, ' '),
  }));
  get(key: string) {
    const d = this.definitions.find((x) => x.key === key);
    if (!d) throw new BadRequestException('Unknown platform setting');
    return d;
  }
  validate(d: SettingDefinition, value: unknown) {
    if (d.type === 'BOOLEAN' && typeof value !== 'boolean')
      throw new BadRequestException('Expected boolean');
    if (
      d.type === 'INTEGER' &&
      (!Number.isInteger(value) || Number(value) <= 0)
    )
      throw new BadRequestException('Expected positive integer');
    if (
      ['STRING', 'EMAIL', 'ENUM'].includes(d.type) &&
      typeof value !== 'string'
    )
      throw new BadRequestException('Expected string');
    if (
      typeof value === 'string' &&
      (value.includes('\r') || value.includes('\n') || value.length > 2000)
    )
      throw new BadRequestException('Unsafe setting value');
    if (d.type === 'EMAIL' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value)))
      throw new BadRequestException('Invalid email');
    if (d.key.includes('currency') && !/^[A-Z]{3}$/.test(String(value)))
      throw new BadRequestException('Invalid currency');
    if (d.key.includes('timezone')) {
      try {
        Intl.DateTimeFormat('en', { timeZone: String(value) });
      } catch {
        throw new BadRequestException('Invalid IANA timezone');
      }
    }
    if (
      d.key === 'registration.default_student_role_code' &&
      String(value).toUpperCase().includes('ADMIN')
    )
      throw new BadRequestException(
        'Administrator cannot be the default Student role',
      );
    if (
      d.key === 'reports.maximum_export_rows' &&
      Number(value) > Number(process.env.REPORT_EXPORT_MAX_ROWS ?? 100000)
    )
      throw new BadRequestException('Environment report-row limit exceeded');
    if (
      d.key === 'payment.receipt_max_size_mb' &&
      Number(value) > Number(process.env.PAYMENT_RECEIPT_MAX_SIZE_MB ?? 10)
    )
      throw new BadRequestException('Environment upload limit exceeded');
    if (
      d.key === 'notifications.email_enabled' &&
      value === true &&
      process.env.MAIL_ENABLED !== 'true'
    )
      throw new BadRequestException(
        'Mail is disabled by deployment configuration',
      );
    if (
      d.key === 'certificates.generation_enabled' &&
      value === true &&
      process.env.CERTIFICATE_GENERATION_ENABLED === 'false'
    )
      throw new BadRequestException(
        'Certificate generation is disabled by deployment configuration',
      );
  }
  authorize(d: SettingDefinition, permissions: string[], admin = false) {
    if (
      !admin &&
      !permissions.includes('settings.update') &&
      !permissions.includes(d.permission as any)
    )
      throw new ForbiddenException('Setting-specific permission required');
  }
}
