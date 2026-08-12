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
import { StaffCourseDashboardService } from '../services/staff-course-dashboard.service';

/**
 * Staff Course Dashboard Controller
 *
 * Provides dashboard data scoped to the authenticated staff member's OWN
 * courses (courses.created_by = req.user.id). Works for any role that has
 * `dashboard.read` + `courses.read` permissions — the role CODE itself is
 * never checked. An administrator should use AdminDashboardController
 * instead (its data is not owner-filtered).
 *
 * Data isolation is enforced entirely in StaffCourseDashboardService via
 * SQL WHERE clauses — the userId is taken from the authenticated JWT, not
 * from a query parameter.
 */
@Controller('staff/dashboard')
@ApiTags('Staff Course Dashboard')
@ApiBearerAuth()
@RequirePermissions('dashboard.read', 'courses.read')
export class StaffCourseDashboardController {
  constructor(private readonly service: StaffCourseDashboardService) {}

  /** Authenticated user's own ID from the JWT-populated authorization context. */
  private userId(request: Request): string {
    return (
      (request as unknown as { authorization?: { userId?: string } })
        .authorization?.userId ?? ''
    );
  }

  private permissions(request: Request): string[] {
    return (
      (request as unknown as { authorization?: { permissions?: string[] } })
        .authorization?.permissions ?? []
    );
  }

  private showFinancial(request: Request): boolean {
    return this.permissions(request).includes('dashboard.read_financial');
  }

  @Get('overview')
  @ApiOperation({
    summary:
      'Full staff dashboard overview — KPIs, recent enrollments/completions, top courses. ' +
      'All data is scoped to courses owned by the authenticated user.',
  })
  overview(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.service.overview(
      this.userId(request),
      query,
      this.showFinancial(request),
    );
  }

  @Get('kpis')
  @ApiOperation({
    summary: 'KPI cards for courses owned by the authenticated staff member.',
  })
  kpis(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.service.kpis(
      this.userId(request),
      query,
      this.showFinancial(request),
    );
  }

  @Get('trends/enrollments')
  @ApiOperation({
    summary: "Enrollment trend for authenticated staff member's courses.",
  })
  enrollmentTrend(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.service.enrollmentTrend(this.userId(request), query);
  }

  @Get('trends/completions')
  @ApiOperation({
    summary: "Completion trend for authenticated staff member's courses.",
  })
  completionTrend(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.service.completionTrend(this.userId(request), query);
  }

  @Get('course-performance')
  @ApiOperation({
    summary:
      "Per-course performance table — scoped to authenticated staff member's courses only.",
  })
  coursePerformance(
    @Query() query: CoursePerformanceQueryDto,
    @Req() request: Request,
  ) {
    return this.service.coursePerformance(
      this.userId(request),
      query,
      this.showFinancial(request),
    );
  }

  @Get('recent-enrollments')
  @ApiOperation({
    summary: "Recent enrollments in authenticated staff member's courses.",
  })
  recentEnrollments(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.service.recentEnrollments(this.userId(request), query.limit);
  }

  @Get('recent-completions')
  @ApiOperation({
    summary: "Recent completions in authenticated staff member's courses.",
  })
  recentCompletions(
    @Query() query: DashboardLimitQueryDto,
    @Req() request: Request,
  ) {
    return this.service.recentCompletions(this.userId(request), query.limit);
  }
}
