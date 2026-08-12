import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';
import { AdminReportsController } from './reports/controllers/admin-reports.controller';
import { AdminReportExportsController } from './reports/controllers/admin-report-exports.controller';
import { AdminAuditLogsController } from './audit/admin-audit-logs.controller';
import { AdminSettingsController } from './settings/admin-settings.controller';
import { ReportRepository } from './reports/repositories/report.repository';
import { ReportsService } from './reports/services/reports.service';
import { ReportPrivacyService } from './reports/services/report-privacy.service';
import { ReportRegistryService } from './reports/services/report-registry.service';
import { ReportExportService } from './reports/services/report-export.service';
import {
  CsvReportExporter,
  PdfReportExporter,
} from './reports/exporters/report.exporters';
import { ReportExportProcessor } from './reports/workers/report-export.processor';
import { SettingRegistryService } from './settings/settings';
import { PlatformSettingsService } from './settings/platform-settings.service';
@Module({
  imports: [DatabaseModule, AuditModule, StorageModule],
  controllers: [
    AdminReportsController,
    AdminReportExportsController,
    AdminAuditLogsController,
    AdminSettingsController,
  ],
  providers: [
    ReportRepository,
    ReportsService,
    ReportPrivacyService,
    ReportRegistryService,
    ReportExportService,
    CsvReportExporter,
    PdfReportExporter,
    ReportExportProcessor,
    SettingRegistryService,
    PlatformSettingsService,
  ],
  exports: [ReportExportProcessor, ReportPrivacyService],
})
export class AdministrationModule {}
