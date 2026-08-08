import { BadRequestException } from '@nestjs/common';
import { ReportRegistryService } from '../report-registry.service';

describe('ReportRegistryService', () => {
  const registry = new ReportRegistryService();

  it('assertType accepts a known report type and rejects an unknown one', () => {
    expect(() => registry.assertType('PAYMENTS')).not.toThrow();
    expect(() => registry.assertType('NOT_A_REPORT')).toThrow(
      BadRequestException,
    );
  });

  it('validateColumns accepts known columns and rejects unknown ones', () => {
    expect(() => registry.validateColumns(['id', 'email'])).not.toThrow();
    expect(() => registry.validateColumns(['id', 'ssn'])).toThrow(
      BadRequestException,
    );
    expect(() => registry.validateColumns(undefined)).not.toThrow();
  });

  it('hasSensitiveColumns flags the email column only', () => {
    expect(registry.hasSensitiveColumns(['id', 'email'])).toBe(true);
    expect(registry.hasSensitiveColumns(['id', 'status'])).toBe(false);
    expect(registry.hasSensitiveColumns(undefined)).toBe(false);
  });

  it('requiresAuditExport flags only administrator activity and authentication security events', () => {
    expect(registry.requiresAuditExport('ADMINISTRATOR_ACTIVITY')).toBe(true);
    expect(registry.requiresAuditExport('AUTHENTICATION_SECURITY_EVENTS')).toBe(
      true,
    );
    expect(registry.requiresAuditExport('PAYMENTS')).toBe(false);
  });
});
