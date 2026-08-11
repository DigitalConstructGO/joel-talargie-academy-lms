import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CoursePerformanceQueryDto,
  DashboardLimitQueryDto,
  DashboardQueryDto,
  DashboardTrendQueryDto,
} from '../dashboard-query.dto';

describe('dashboard DTOs', () => {
  describe('DashboardQueryDto', () => {
    it('applies defaults for an empty query', async () => {
      const instance = plainToInstance(DashboardQueryDto, {});
      expect(instance.range).toBe('LAST_30_DAYS');
      expect(instance.comparison).toBe(true);
      expect(instance.previewLimit).toBe(5);
      expect(await validate(instance)).toHaveLength(0);
    });

    it('rejects an unrecognized range preset', async () => {
      const errors = await validate(
        plainToInstance(DashboardQueryDto, { range: 'NOT_A_RANGE' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a malformed from/to date', async () => {
      const errors = await validate(
        plainToInstance(DashboardQueryDto, { from: 'not-a-date' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a previewLimit above the maximum', async () => {
      const errors = await validate(
        plainToInstance(DashboardQueryDto, { previewLimit: 50 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a full custom-range query', async () => {
      const errors = await validate(
        plainToInstance(DashboardQueryDto, {
          range: 'CUSTOM',
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-08-01T00:00:00.000Z',
          timezone: 'Africa/Addis_Ababa',
          comparison: false,
          previewLimit: 8,
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('DashboardTrendQueryDto', () => {
    it('defaults granularity to DAY', () => {
      const instance = plainToInstance(DashboardTrendQueryDto, {});
      expect(instance.granularity).toBe('DAY');
    });

    it('rejects an unrecognized granularity', async () => {
      const errors = await validate(
        plainToInstance(DashboardTrendQueryDto, { granularity: 'YEAR' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('DashboardLimitQueryDto applies a default limit and rejects values above the maximum', async () => {
    const instance = plainToInstance(DashboardLimitQueryDto, {});
    expect(instance.limit).toBe(5);
    const errors = await validate(
      plainToInstance(DashboardLimitQueryDto, { limit: 50 }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  describe('CoursePerformanceQueryDto', () => {
    it('defaults sort to ENROLLMENTS and limit to 10', () => {
      const instance = plainToInstance(CoursePerformanceQueryDto, {});
      expect(instance.sort).toBe('ENROLLMENTS');
      expect(instance.limit).toBe(10);
    });

    it('accepts every valid sort key', async () => {
      for (const sort of [
        'ENROLLMENTS',
        'COMPLETIONS',
        'COMPLETION_RATE',
        'AVERAGE_PROGRESS',
        'REVENUE',
      ]) {
        const errors = await validate(
          plainToInstance(CoursePerformanceQueryDto, { sort }),
        );
        expect(errors).toHaveLength(0);
      }
    });

    it('rejects an unrecognized sort key', async () => {
      const errors = await validate(
        plainToInstance(CoursePerformanceQueryDto, { sort: 'RANDOM' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
