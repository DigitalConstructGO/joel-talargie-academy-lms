import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateReportExportDto,
  ExportListQueryDto,
  ReportExportReasonDto,
  ReportQueryDto,
} from '../reports.dto';

describe('reports DTOs', () => {
  describe('ReportQueryDto', () => {
    it('applies page/pageSize/sortDirection defaults', () => {
      const instance = plainToInstance(ReportQueryDto, {});
      expect(instance.page).toBe(1);
      expect(instance.pageSize).toBe(10);
      expect(instance.sortDirection).toBe('desc');
    });

    it('rejects an unrecognized groupBy', async () => {
      const errors = await validate(
        plainToInstance(ReportQueryDto, { groupBy: 'year' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a fully populated query', async () => {
      const errors = await validate(
        plainToInstance(ReportQueryDto, {
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-08-01T00:00:00.000Z',
          status: 'COMPLETED',
          courseId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          studentId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          categoryId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          actorId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          search: 'ada',
          groupBy: 'week',
          sortDirection: 'asc',
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateReportExportDto', () => {
    it('requires a known reportType and format', async () => {
      const errors = await validate(
        plainToInstance(CreateReportExportDto, {
          reportType: 'NOT_A_TYPE',
          format: 'CSV',
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a minimal valid payload with defaults applied', async () => {
      const instance = plainToInstance(CreateReportExportDto, {
        reportType: 'PAYMENTS',
        format: 'CSV',
      });
      expect(instance.locale).toBe('en');
      expect(instance.timezone).toBe('UTC');
      expect(instance.filters).toEqual({});
      expect(await validate(instance)).toHaveLength(0);
    });

    it('rejects an unrecognized export format', async () => {
      const errors = await validate(
        plainToInstance(CreateReportExportDto, {
          reportType: 'PAYMENTS',
          format: 'DOCX',
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ExportListQueryDto', () => {
    it('inherits ReportQueryDto defaults and accepts optional filters', async () => {
      const instance = plainToInstance(ExportListQueryDto, {
        reportType: 'PAYMENTS',
        format: 'CSV',
      });
      expect(instance.page).toBe(1);
      expect(await validate(instance)).toHaveLength(0);
    });
  });

  describe('ReportExportReasonDto', () => {
    it('requires a reason within the length bounds', async () => {
      const errors = await validate(
        plainToInstance(ReportExportReasonDto, { reason: 'hi' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a valid reason', async () => {
      const errors = await validate(
        plainToInstance(ReportExportReasonDto, {
          reason: 'Retry after outage',
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });
});
