import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AdministrationModule } from '../administration/administration.module';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { DashboardDateRangeService } from './services/dashboard-date-range.service';
import { DashboardService } from './services/dashboard.service';
@Module({
  imports: [DatabaseModule, AdministrationModule],
  controllers: [AdminDashboardController],
  providers: [DashboardDateRangeService, DashboardService],
})
export class DashboardModule {}
