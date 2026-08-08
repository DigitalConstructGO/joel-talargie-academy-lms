import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  CoursePerformanceQueryDto,
  DashboardLimitQueryDto,
  DashboardQueryDto,
  DashboardTrendQueryDto,
} from '../dto/dashboard-query.dto';
import { DashboardService } from '../services/dashboard.service';

@Controller('admin/dashboard')
@ApiTags('Administrator Dashboard')
@ApiBearerAuth()
@RequirePermissions('dashboard.read')
export class AdminDashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  private permissions(request: Request): string[] {
    return (
      (request as unknown as { authorization?: { permissions?: string[] } })
        .authorization?.permissions ?? []
    );
  }
  @Get('overview')
  @ApiOperation({
    summary:
      'Bounded operational dashboard overview; unauthorized sections are omitted',
  })
  overview(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.dashboard.overview(query, this.permissions(request));
  }
  @Get('kpis')
  @ApiOperation({
    summary:
      'Dashboard KPI cards using documented PostgreSQL source-of-truth definitions',
  })
  kpis(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.dashboard.kpis(query, this.permissions(request));
  }
  @Get('trends/registrations') registrations(
    @Query() query: DashboardTrendQueryDto,
  ) {
    return this.dashboard.trend('registrations', query);
  }
  @Get('trends/enrollments') enrollments(
    @Query() query: DashboardTrendQueryDto,
  ) {
    return this.dashboard.trend('enrollments', query);
  }
  @Get('trends/payments') payments(@Query() query: DashboardTrendQueryDto) {
    return this.dashboard.trend('payments', query);
  }
  @Get('trends/revenue')
  @RequirePermissions('dashboard.read', 'dashboard.read_financial')
  revenue(@Query() query: DashboardTrendQueryDto) {
    return this.dashboard.trend('revenue', query);
  }
  @Get('trends/completions') completions(
    @Query() query: DashboardTrendQueryDto,
  ) {
    return this.dashboard.trend('completions', query);
  }
  @Get('trends/certificates') certificates(
    @Query() query: DashboardTrendQueryDto,
  ) {
    return this.dashboard.trend('certificates', query);
  }
  @Get('pending-payments') pendingPayments(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.pendingPayments(
      query.limit,
      this.permissions(request).includes('dashboard.read_financial'),
    );
  }
  @Get('recent-students') recentStudents(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.recentStudents(
      query.limit,
      this.permissions(request).includes('dashboard.read_sensitive'),
    );
  }
  @Get('recent-enrollments') recentEnrollments(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.recentEnrollments(
      query.limit,
      this.permissions(request).includes('dashboard.read_financial'),
    );
  }
  @Get('recent-completions') recentCompletions(
    @Query() query: DashboardLimitQueryDto,
  ) {
    return this.dashboard.recentCompletions(query.limit);
  }
  @Get('recent-certificates') recentCertificates(
    @Query() query: DashboardLimitQueryDto,
  ) {
    return this.dashboard.recentCertificates(query.limit);
  }
  @Get('course-performance') coursePerformance(
    @Query() query: CoursePerformanceQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.coursePerformance(
      query,
      this.permissions(request).includes('dashboard.read_financial'),
    );
  }
  @Get('courses/top') topCourses(
    @Query() query: CoursePerformanceQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.coursePerformance(
      query,
      this.permissions(request).includes('dashboard.read_financial'),
    );
  }
  @Get('courses/low-completion') lowCompletion(
    @Query() query: CoursePerformanceQueryDto,
  ) {
    return this.dashboard.lowCompletion(query);
  }
  @Get('enrollment-distribution') distribution(
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboard.distribution(query);
  }
  @Get('recent-activity')
  @RequirePermissions('dashboard.read', 'dashboard.read_administrator_activity')
  recentActivity(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.recentActivity(
      query.limit,
      this.permissions(request).includes('dashboard.read_sensitive'),
    );
  }
  @Get('operational-health')
  @RequirePermissions('dashboard.read', 'dashboard.read_operational_health')
  health() {
    return this.dashboard.health();
  }
}
