import { BadRequestException } from '@nestjs/common';
import { DashboardDateRangeService } from '../dashboard-date-range.service';

describe('DashboardDateRangeService', () => {
  const service = new DashboardDateRangeService();

  it('rejects an invalid IANA timezone', () => {
    expect(() =>
      service.resolve({ range: 'TODAY', timezone: 'Not/AZone' } as never),
    ).toThrow(BadRequestException);
  });

  it('defaults the timezone to Africa/Addis_Ababa', () => {
    const result = service.resolve({ range: 'TODAY' } as never);
    expect(result.timezone).toBe('Africa/Addis_Ababa');
  });

  it.each([
    'TODAY',
    'LAST_7_DAYS',
    'LAST_90_DAYS',
    'THIS_MONTH',
    'LAST_MONTH',
    'THIS_YEAR',
  ] as const)('resolves the %s preset to a valid from/to range', (range) => {
    const result = service.resolve({ range } as never);
    expect(result.preset).toBe(range);
    expect(result.from.getTime()).toBeLessThan(result.to.getTime());
    expect(result.previous).toBeNull();
  });

  it('falls back to the default 30-day window for an unrecognized preset', () => {
    const result = service.resolve({ range: 'UNKNOWN' } as never);
    const days = Math.round(
      (result.to.getTime() - result.from.getTime()) / 86400000,
    );
    expect(days).toBe(30);
  });

  describe('CUSTOM range', () => {
    it('requires both from and to', () => {
      expect(() =>
        service.resolve({ range: 'CUSTOM', from: '2026-01-01' } as never),
      ).toThrow(BadRequestException);
    });

    it('accepts a valid custom range', () => {
      const result = service.resolve({
        range: 'CUSTOM',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T00:00:00.000Z',
      } as never);
      expect(result.preset).toBe('CUSTOM');
    });

    it('rejects an unparseable custom date', () => {
      expect(() =>
        service.resolve({
          range: 'CUSTOM',
          from: 'not-a-date',
          to: '2026-01-31T00:00:00.000Z',
        } as never),
      ).toThrow(BadRequestException);
    });

    it('rejects a range where from is not before to', () => {
      expect(() =>
        service.resolve({
          range: 'CUSTOM',
          from: '2026-02-01T00:00:00.000Z',
          to: '2026-01-01T00:00:00.000Z',
        } as never),
      ).toThrow(BadRequestException);
    });

    it('rejects a range spanning more than 366 days', () => {
      expect(() =>
        service.resolve({
          range: 'CUSTOM',
          from: '2020-01-01T00:00:00.000Z',
          to: '2026-01-01T00:00:00.000Z',
        } as never),
      ).toThrow(BadRequestException);
    });
  });

  it('includes a previous-period comparison window when comparison is requested', () => {
    const result = service.resolve({
      range: 'CUSTOM',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T00:00:00.000Z',
      comparison: true,
    } as never);
    expect(result.previous).not.toBeNull();
    expect(result.previous!.to.getTime()).toBe(result.from.getTime());
  });
});
