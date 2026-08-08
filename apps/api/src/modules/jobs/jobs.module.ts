import { Module } from '@nestjs/common';
import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';
import { DatabaseModule } from '../../common/database/database.module';
@Module({
  imports: [DatabaseModule],
  providers: [JobsRepository, JobsService],
  exports: [JobsService],
})
export class JobsModule {}
