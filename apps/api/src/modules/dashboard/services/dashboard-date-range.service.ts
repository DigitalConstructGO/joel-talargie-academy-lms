import { BadRequestException, Injectable } from '@nestjs/common';
import type { DashboardQueryDto } from '../dto/dashboard-query.dto';

export interface DashboardRange {
  preset: string;
  from: Date;
  to: Date;
  timezone: string;
  previous: { from: Date; to: Date } | null;
}
@Injectable()
export class DashboardDateRangeService {
  resolve(query: DashboardQueryDto): DashboardRange {
    const timezone = query.timezone ?? 'Africa/Addis_Ababa';
    try {
      Intl.DateTimeFormat('en', { timeZone: timezone });
    } catch {
      throw new BadRequestException({ code: 'DASHBOARD_TIMEZONE_INVALID' });
    }
    const now = new Date();
    let from: Date;
    let to: Date;
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    switch (query.range) {
      case 'TODAY':
        from = day;
        to = new Date(day.getTime() + 86400000);
        break;
      case 'LAST_7_DAYS':
        from = new Date(day.getTime() - 6 * 86400000);
        to = new Date(day.getTime() + 86400000);
        break;
      case 'LAST_90_DAYS':
        from = new Date(day.getTime() - 89 * 86400000);
        to = new Date(day.getTime() + 86400000);
        break;
      case 'THIS_MONTH':
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        break;
      case 'LAST_MONTH':
        from = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
        );
        to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        break;
      case 'THIS_YEAR':
        from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        to = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
        break;
      case 'CUSTOM':
        if (!query.from || !query.to)
          throw new BadRequestException({
            code: 'DASHBOARD_CUSTOM_RANGE_REQUIRED',
          });
        from = new Date(query.from);
        to = new Date(query.to);
        break;
      default:
        from = new Date(day.getTime() - 29 * 86400000);
        to = new Date(day.getTime() + 86400000);
    }
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from >= to
    )
      throw new BadRequestException({ code: 'DASHBOARD_RANGE_INVALID' });
    if (to.getTime() - from.getTime() > 366 * 86400000)
      throw new BadRequestException({ code: 'DASHBOARD_DATE_RANGE_TOO_LARGE' });
    const duration = to.getTime() - from.getTime();
    return {
      preset: query.range,
      from,
      to,
      timezone,
      previous: query.comparison
        ? { from: new Date(from.getTime() - duration), to: from }
        : null,
    };
  }
}
