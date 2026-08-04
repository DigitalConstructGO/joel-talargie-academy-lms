import { BadRequestException } from '@nestjs/common';
import { DashboardDateRangeService } from '../services/dashboard-date-range.service';
import type { DashboardQueryDto } from '../dto/dashboard-query.dto';
describe('DashboardDateRangeService', () => {
  const service = new DashboardDateRangeService();
  it('defaults to a bounded 30-day range with an equivalent previous period', () => {
    const range = service.resolve({
      range: 'LAST_30_DAYS',
      comparison: true,
    } as DashboardQueryDto);
    expect(range.to.getTime() - range.from.getTime()).toBe(30 * 86400000);
    expect(range.previous?.to).toEqual(range.from);
  });
  it('requires both custom dates', () =>
    expect(() =>
      service.resolve({ range: 'CUSTOM' } as DashboardQueryDto),
    ).toThrow(BadRequestException));
  it('rejects inverted and excessive ranges', () => {
    expect(() =>
      service.resolve({
        range: 'CUSTOM',
        from: '2026-08-02',
        to: '2026-08-01',
      } as DashboardQueryDto),
    ).toThrow(BadRequestException);
    expect(() =>
      service.resolve({
        range: 'CUSTOM',
        from: '2024-01-01',
        to: '2026-01-02',
      } as DashboardQueryDto),
    ).toThrow(BadRequestException);
  });
});
