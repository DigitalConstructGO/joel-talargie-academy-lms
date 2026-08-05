import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '../common/database/database.module';
import { StorageModule } from '../modules/storage/storage.module';
@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
