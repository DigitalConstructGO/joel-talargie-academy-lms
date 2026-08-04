import { BadRequestException, Injectable } from '@nestjs/common';
import { ReportRepository } from '../repositories/report.repository';
import { ReportPrivacyService } from './report-privacy.service';
import type { ReportType } from '../report.types';
import { ReportQueryDto } from '../dto/reports.dto';
@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportRepository,
    private readonly privacy: ReportPrivacyService,
  ) {}
  async get(type: ReportType, q: ReportQueryDto, sensitive = false) {
    if (q.from && q.to && new Date(q.from) > new Date(q.to))
      throw new BadRequestException('from must not be after to');
    const result = await this.repository.query(type, q);
    const rows = result.rows.map((raw: any) => {
      const row = { ...raw };
      if (row.email && !sensitive)
        row.email = this.privacy.maskEmail(row.email);
      if (row.ipAddress && !sensitive)
        row.ipAddress = this.privacy.maskIp(row.ipAddress);
      if (row.before) row.before = this.privacy.sanitize(row.before);
      if (row.after) row.after = this.privacy.sanitize(row.after);
      if (!sensitive) {
        delete row.reviewNote;
      }
      return row;
    });
    return {
      summary: result.summary,
      rows,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total: result.total,
        filters: q,
        generatedAt: new Date().toISOString(),
        timezone: 'UTC',
      },
    };
  }
}
