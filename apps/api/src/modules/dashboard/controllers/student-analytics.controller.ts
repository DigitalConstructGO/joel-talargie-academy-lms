import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  DashboardQueryDto,
  DashboardTrendQueryDto,
} from '../dto/dashboard-query.dto';
import { StudentAnalyticsService } from '../services/student-analytics.service';

/**
 * Student Analytics Controller
 *
 * Provides the authenticated student's own learning analytics.
 * studentId is taken from the JWT authorization context — never from a
 * query parameter — so manipulation is structurally impossible.
 *
 * No permission beyond `dashboard.read` is required because students
 * can only ever see their own data and there is no cross-student risk.
 */
@Controller('student/analytics')
@ApiTags('Student Analytics')
@ApiBearerAuth()
@RequirePermissions('dashboard.read')
export class StudentAnalyticsController {
  constructor(private readonly service: StudentAnalyticsService) {}

  /** Authenticated student's user ID from the JWT-populated authorization context. */
  private studentId(request: Request): string {
    return (
      (request as unknown as { authorization?: { userId?: string } })
        .authorization?.userId ?? ''
    );
  }

  @Get('overview')
  @ApiOperation({
    summary:
      'Full student analytics overview — KPIs, enrollment progress, learning trends. ' +
      "Completely isolated to the authenticated student's own data.",
  })
  overview(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.service.overview(this.studentId(request), query);
  }

  @Get('kpis')
  @ApiOperation({
    summary:
      'Student KPI cards — enrolled, in-progress, completed, certificates.',
  })
  kpis(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.service.kpis(this.studentId(request), query);
  }

  @Get('progress')
  @ApiOperation({
    summary: 'Per-enrollment progress list for the authenticated student.',
  })
  progress(@Req() request: Request) {
    return this.service.enrollmentProgress(this.studentId(request));
  }

  @Get('trends/learning-activity')
  @ApiOperation({
    summary: 'Lesson completion trend for the authenticated student.',
  })
  learningActivity(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.service.learningActivityTrend(this.studentId(request), query);
  }

  @Get('trends/enrollments')
  @ApiOperation({ summary: 'Enrollment trend for the authenticated student.' })
  enrollmentTrend(
    @Query() query: DashboardTrendQueryDto,
    @Req() request: Request,
  ) {
    return this.service.enrollmentTrend(this.studentId(request), query);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Payment history for the authenticated student.' })
  payments(@Query() query: DashboardQueryDto, @Req() request: Request) {
    return this.service.paymentHistory(this.studentId(request), query);
  }
}
