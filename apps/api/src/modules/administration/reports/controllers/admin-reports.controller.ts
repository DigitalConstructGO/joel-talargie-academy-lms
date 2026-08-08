import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequirePermissions } from '../../../authorization/decorators/require-permissions.decorator';
import { ReportQueryDto } from '../dto/reports.dto';
import { ReportsService } from '../services/reports.service';
import type { ReportType } from '../report.types';
@Controller('admin/reports')
@ApiTags('Administrator Reports')
@ApiBearerAuth()
@RequirePermissions('reports.read')
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}
  private run(type: ReportType, q: ReportQueryDto, req: Request) {
    const p = (req as any).authorization?.permissions ?? [];
    return this.reports.get(type, q, p.includes('reports.read_sensitive'));
  }
  @Get('registrations')
  @ApiOperation({
    summary:
      'Filtered Student registration report; sensitive fields are masked by default',
  })
  registrations(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('USER_REGISTRATIONS', q, r);
  }
  @Get('user-statuses')
  @ApiOperation({ summary: 'Filtered user-account status report' })
  statuses(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('USER_ACCOUNT_STATUS', q, r);
  }
  @Get('enrollments')
  @ApiOperation({
    summary: 'Enrollment report using immutable price snapshots',
  })
  enrollments(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('COURSE_ENROLLMENTS', q, r);
  }
  @Get('course-participation')
  @ApiOperation({ summary: 'Course participation report' })
  participation(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('COURSE_PARTICIPATION', q, r);
  }
  @Get('learning-progress')
  @ApiOperation({ summary: 'Learning progress report without lesson content' })
  learning(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('LEARNING_PROGRESS', q, r);
  }
  @Get('course-completions')
  @ApiOperation({ summary: 'Course completion report' })
  completions(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('COURSE_COMPLETIONS', q, r);
  }
  @Get('payments')
  @ApiOperation({
    summary: 'Manual payment report; receipt storage is excluded',
  })
  payments(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('PAYMENTS', q, r);
  }
  @Get('revenue')
  @ApiOperation({
    summary:
      'Approved-payment revenue grouped by currency with exact PostgreSQL decimals',
  })
  revenue(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('REVENUE', q, r);
  }
  @Get('payment-review-performance')
  @ApiOperation({ summary: 'Payment-review performance report' })
  reviews(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('PAYMENT_REVIEW_PERFORMANCE', q, r);
  }
  @Get('certificates')
  @ApiOperation({
    summary: 'Certificate status report using immutable issue snapshots',
  })
  certificates(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('CERTIFICATES', q, r);
  }
  @Get('certificate-generation')
  @ApiOperation({ summary: 'Certificate generation report' })
  generation(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('CERTIFICATE_GENERATION', q, r);
  }
  @Get('administrator-activity')
  @ApiOperation({ summary: 'Sanitized administrator activity report' })
  activity(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('ADMINISTRATOR_ACTIVITY', q, r);
  }
  @Get('security-events')
  @ApiOperation({
    summary: 'Sanitized authentication and security-event report',
  })
  security(@Query() q: ReportQueryDto, @Req() r: Request) {
    return this.run('AUTHENTICATION_SECURITY_EVENTS', q, r);
  }
}
