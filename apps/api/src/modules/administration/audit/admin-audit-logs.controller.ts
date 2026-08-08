import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { eq, schema } from '@joel-academy/database';
import type { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { ReportQueryDto } from '../reports/dto/reports.dto';
import { ReportsService } from '../reports/services/reports.service';
import { ReportPrivacyService } from '../reports/services/report-privacy.service';
@Controller('admin/audit-logs')
@ApiTags('Audit Logs')
@ApiBearerAuth()
@RequirePermissions('audit.read')
export class AdminAuditLogsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly db: DatabaseService,
    private readonly privacy: ReportPrivacyService,
  ) {}
  @Get()
  @ApiOperation({
    summary:
      'Explore immutable audit logs with stable pagination and sanitized metadata',
  })
  list(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.reports.get(
      'ADMINISTRATOR_ACTIVITY',
      q,
      ((r as any).authorization?.permissions ?? []).includes(
        'audit.read_sensitive',
      ),
    );
  }
  @Get(':id')
  @ApiOperation({
    summary:
      'View one immutable audit event; secrets are always recursively redacted',
  })
  async detail(@Param('id', ParseUUIDPipe) id: string, @Req() r: Request) {
    const [row] = await this.db.client
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Audit log not found');
    const sensitive = ((r as any).authorization?.permissions ?? []).includes(
      'audit.read_sensitive',
    );
    return {
      ...row,
      before: this.privacy.sanitize(row.before),
      after: this.privacy.sanitize(row.after),
      ipAddress: sensitive ? row.ipAddress : this.privacy.maskIp(row.ipAddress),
      userAgent: sensitive
        ? row.userAgent
        : row.userAgent?.split(' ').slice(0, 2).join(' '),
    };
  }
}
