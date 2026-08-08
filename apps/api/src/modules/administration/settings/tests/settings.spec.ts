import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SettingRegistryService } from '../settings';

describe('SettingRegistryService', () => {
  const registry = new SettingRegistryService();

  it('exposes every definition with defaulted permission/editable/restartRequired/description', () => {
    expect(registry.definitions.length).toBeGreaterThan(0);
    const d = registry.get('academy.name');
    expect(d.permission).toBe('settings.update_academy');
    expect(d.editable).toBe(true);
    expect(d.restartRequired).toBe(false);
    expect(d.description).toBe('academy name');
  });

  it('get() throws BadRequestException for an unknown key', () => {
    expect(() => registry.get('nonexistent.key')).toThrow(BadRequestException);
  });

  describe('validate', () => {
    const d = (key: string) => registry.get(key);

    it('requires a boolean for BOOLEAN settings', () => {
      expect(() =>
        registry.validate(d('registration.enabled'), 'true'),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('registration.enabled'), true),
      ).not.toThrow();
    });

    it('requires a positive integer for INTEGER settings', () => {
      expect(() =>
        registry.validate(d('payment.receipt_max_size_mb'), 0),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('payment.receipt_max_size_mb'), 1.5),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('payment.receipt_max_size_mb'), 5),
      ).not.toThrow();
    });

    it('requires a string for STRING/EMAIL/ENUM settings', () => {
      expect(() => registry.validate(d('academy.name'), 123)).toThrow(
        BadRequestException,
      );
    });

    it('rejects newlines/carriage returns/overlong strings', () => {
      expect(() =>
        registry.validate(d('academy.name'), 'line1\nline2'),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('academy.name'), 'a'.repeat(2001)),
      ).toThrow(BadRequestException);
    });

    it('validates email format for EMAIL settings', () => {
      expect(() =>
        registry.validate(d('academy.support_email'), 'not-an-email'),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('academy.support_email'), 'ok@example.com'),
      ).not.toThrow();
    });

    it('validates 3-letter uppercase currency codes', () => {
      expect(() =>
        registry.validate(d('academy.default_currency'), 'etb'),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('academy.default_currency'), 'ETB'),
      ).not.toThrow();
    });

    it('validates IANA timezone strings', () => {
      expect(() =>
        registry.validate(d('academy.timezone'), 'Not/AZone'),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('academy.timezone'), 'Africa/Addis_Ababa'),
      ).not.toThrow();
    });

    it('rejects an administrator role code as the default student role', () => {
      expect(() =>
        registry.validate(
          d('registration.default_student_role_code'),
          'ADMINISTRATOR',
        ),
      ).toThrow(BadRequestException);
    });

    it('enforces the environment cap on reports.maximum_export_rows', () => {
      const prev = process.env.REPORT_EXPORT_MAX_ROWS;
      process.env.REPORT_EXPORT_MAX_ROWS = '1000';
      expect(() =>
        registry.validate(d('reports.maximum_export_rows'), 5000),
      ).toThrow(BadRequestException);
      expect(() =>
        registry.validate(d('reports.maximum_export_rows'), 500),
      ).not.toThrow();
      process.env.REPORT_EXPORT_MAX_ROWS = prev;
    });

    it('enforces the environment cap on payment.receipt_max_size_mb', () => {
      const prev = process.env.PAYMENT_RECEIPT_MAX_SIZE_MB;
      process.env.PAYMENT_RECEIPT_MAX_SIZE_MB = '5';
      expect(() =>
        registry.validate(d('payment.receipt_max_size_mb'), 20),
      ).toThrow(BadRequestException);
      process.env.PAYMENT_RECEIPT_MAX_SIZE_MB = prev;
    });

    it('blocks enabling notifications.email_enabled when MAIL_ENABLED is not true', () => {
      const prev = process.env.MAIL_ENABLED;
      process.env.MAIL_ENABLED = 'false';
      expect(() =>
        registry.validate(d('notifications.email_enabled'), true),
      ).toThrow(BadRequestException);
      process.env.MAIL_ENABLED = 'true';
      expect(() =>
        registry.validate(d('notifications.email_enabled'), true),
      ).not.toThrow();
      process.env.MAIL_ENABLED = prev;
    });

    it('blocks enabling certificates.generation_enabled when disabled by deployment config', () => {
      const prev = process.env.CERTIFICATE_GENERATION_ENABLED;
      process.env.CERTIFICATE_GENERATION_ENABLED = 'false';
      expect(() =>
        registry.validate(d('certificates.generation_enabled'), true),
      ).toThrow(BadRequestException);
      process.env.CERTIFICATE_GENERATION_ENABLED = prev;
    });
  });

  describe('authorize', () => {
    const d = registry.get('academy.name');

    it('allows an administrator regardless of permissions', () => {
      expect(() => registry.authorize(d, [], true)).not.toThrow();
    });

    it('allows a caller with the generic settings.update permission', () => {
      expect(() =>
        registry.authorize(d, ['settings.update'], false),
      ).not.toThrow();
    });

    it('allows a caller with the setting-specific permission', () => {
      expect(() =>
        registry.authorize(d, ['settings.update_academy'], false),
      ).not.toThrow();
    });

    it('rejects a caller without any relevant permission', () => {
      expect(() => registry.authorize(d, ['other.permission'], false)).toThrow(
        ForbiddenException,
      );
    });
  });
});
