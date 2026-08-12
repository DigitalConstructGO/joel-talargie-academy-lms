import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AdministrationModule } from '../administration/administration.module';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { StaffCourseDashboardController } from './controllers/staff-course-dashboard.controller';
import { StudentAnalyticsController } from './controllers/student-analytics.controller';
import { DashboardDateRangeService } from './services/dashboard-date-range.service';
import { DashboardService } from './services/dashboard.service';
import { StaffCourseDashboardService } from './services/staff-course-dashboard.service';
import { StudentAnalyticsService } from './services/student-analytics.service';

@Module({
  imports: [DatabaseModule, AdministrationModule],
  controllers: [
    AdminDashboardController,
    StaffCourseDashboardController,
    StudentAnalyticsController,
  ],
  providers: [
    DashboardDateRangeService,
    DashboardService,
    StaffCourseDashboardService,
    StudentAnalyticsService,
  ],
})
export class DashboardModule {}
