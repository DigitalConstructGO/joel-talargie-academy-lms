import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../../authorization/decorators/require-permissions.decorator';
import {
  CreateReportExportDto,
  ExportListQueryDto,
  ReportExportReasonDto,
} from '../dto/reports.dto';
import { ReportExportService } from '../services/report-export.service';
@Controller('admin/report-exports')
@ApiTags('Report Exports')
@ApiBearerAuth()
export class AdminReportExportsController {
  constructor(private readonly service: ReportExportService) {}
  private all(req: Request) {
    return ((req as any).authorization?.permissions ?? []).includes(
      'reports.view_all_exports',
    );
  }
  @Post()
  @RequirePermissions('reports.export')
  @ApiOperation({
    summary: 'Queue a CSV or PDF report export in PostgreSQL',
  })
  create(
    @CurrentUser() u: AuthUser,
    @Body() d: CreateReportExportDto,
    @Req() r: Request,
  ) {
    return this.service.create(
      u.id,
      d,
      (r as any).authorization?.permissions ?? [],
    );
  }
  @Get()
  @RequirePermissions('reports.view_exports')
  @ApiOperation({ summary: 'List private report-export history' })
  list(
    @CurrentUser() u: AuthUser,
    @Query() q: ExportListQueryDto,
    @Req() r: Request,
  ) {
    return this.service.list(u.id, q, this.all(r));
  }
  @Get(':id') @RequirePermissions('reports.view_exports') detail(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: Request,
  ) {
    return this.service.detail(u.id, id, this.all(r));
  }
  @Get(':id/download')
  @RequirePermissions('reports.download_exports')
  @ApiOperation({ summary: 'Create a five-minute private download URL' })
  download(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: Request,
  ) {
    return this.service.download(u.id, id, this.all(r));
  }
  @Post(':id/retry') @RequirePermissions('reports.retry_exports') retry(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: ReportExportReasonDto,
    @Req() r: Request,
  ) {
    return this.service.retry(u.id, id, d.reason, this.all(r));
  }
  @Post(':id/cancel') @RequirePermissions('reports.cancel_exports') cancel(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: ReportExportReasonDto,
    @Req() r: Request,
  ) {
    return this.service.cancel(u.id, id, d.reason, this.all(r));
  }
}
