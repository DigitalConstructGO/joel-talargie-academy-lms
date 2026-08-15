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
import {
  DashboardService,
  type AuthorizationContext,
} from '../services/dashboard.service';

@Controller('admin/dashboard')
@ApiTags('Administrator Dashboard')
@ApiBearerAuth()
@RequirePermissions('dashboard.read')
export class AdminDashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  private authContext(request: Request): AuthorizationContext {
    const raw = (request as unknown as { authorization?: AuthorizationContext })
      .authorization;
    return {
      userId: raw?.userId ?? '',
      status: raw?.status ?? 'ACTIVE',
      roles: raw?.roles ?? [],
      permissions: raw?.permissions ?? [],
      isAdministrator: Boolean(
        raw?.isAdministrator || raw?.roles?.includes('ADMINISTRATOR'),
      ),
    };
  }

  @Get('overview')
  @ApiOperation({
    summary:
      'Role-, permission-, and ownership-scoped operational dashboard overview',
  })
  overview(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.dashboard.overview(query, this.authContext(request));
  }

  @Get('kpis')
  @ApiOperation({
    summary:
      'Dashboard KPI cards scoped to authorized resources and permissions',
  })
  kpis(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.dashboard.kpis(query, this.authContext(request));
  }

  @Get('filter-options')
  @ApiOperation({
    summary:
      'Authorized filter options (courses, categories, instructors) for the caller',
  })
  filterOptions(@Req() request: Request) {
    return this.dashboard.filterOptions(this.authContext(request));
  }

  @Get('trends/registrations')
  registrations(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.trend(
      'registrations',
      query,
      this.authContext(request),
    );
  }

  @Get('trends/enrollments')
  enrollments(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.trend(
      'enrollments',
      query,
      this.authContext(request),
    );
  }

  @Get('trends/payments')
  payments(@Query() query: DashboardTrendQueryDto, @Req() request: Request) {
    return this.dashboard.trend('payments', query, this.authContext(request));
  }

  @Get('trends/revenue')
  @RequirePermissions('dashboard.read', 'dashboard.read_financial')
  revenue(@Query() query: DashboardTrendQueryDto, @Req() request: Request) {
    return this.dashboard.trend('revenue', query, this.authContext(request));
  }

  @Get('trends/completions')
  completions(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.trend(
      'completions',
      query,
      this.authContext(request),
    );
  }

  @Get('trends/certificates')
  certificates(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.trend(
      'certificates',
      query,
      this.authContext(request),
    );
  }

  @Get('pending-payments')
  pendingPayments(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    const auth = this.authContext(request);
    return this.dashboard.pendingPayments(
      query.limit,
      auth.permissions.includes('dashboard.read_financial') ||
        auth.permissions.includes('payments.read'),
      auth,
    );
  }

  @Get('recent-students')
  recentStudents(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    const auth = this.authContext(request);
    return this.dashboard.recentStudents(
      query.limit,
      auth.permissions.includes('dashboard.read_sensitive'),
      auth,
    );
  }

  @Get('recent-enrollments')
  recentEnrollments(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    const auth = this.authContext(request);
    return this.dashboard.recentEnrollments(
      query.limit,
      auth.permissions.includes('dashboard.read_financial') ||
        auth.permissions.includes('payments.read'),
      auth,
    );
  }

  @Get('recent-completions')
  recentCompletions(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.recentCompletions(
      query.limit,
      this.authContext(request),
    );
  }

  @Get('recent-certificates')
  recentCertificates(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.recentCertificates(
      query.limit,
      this.authContext(request),
    );
  }

  @Get('course-performance')
  coursePerformance(
    @Query() query: CoursePerformanceQueryDto,
    @Req() request: Request,
  ) {
    const auth = this.authContext(request);
    return this.dashboard.coursePerformance(
      query,
      auth.permissions.includes('dashboard.read_financial') ||
        auth.permissions.includes('payments.read'),
      auth,
    );
  }

  @Get('courses/top')
  topCourses(
    @Query() query: CoursePerformanceQueryDto,
    @Req() request: Request,
  ) {
    const auth = this.authContext(request);
    return this.dashboard.coursePerformance(
      query,
      auth.permissions.includes('dashboard.read_financial') ||
        auth.permissions.includes('payments.read'),
      auth,
    );
  }

  @Get('courses/low-completion')
  lowCompletion(
    @Query() query: CoursePerformanceQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.lowCompletion(query, this.authContext(request));
  }

  @Get('enrollment-distribution')
  distribution(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.dashboard.distribution(query, this.authContext(request));
  }

  @Get('recent-activity')
  @RequirePermissions('dashboard.read', 'dashboard.read_administrator_activity')
  recentActivity(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.dashboard.recentActivity(
      query.limit,
      this.authContext(request).permissions.includes(
        'dashboard.read_sensitive',
      ),
    );
  }

  @Get('operational-health')
  @RequirePermissions('dashboard.read', 'dashboard.read_operational_health')
  health() {
    return this.dashboard.health();
  }
}
