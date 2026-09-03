import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminEnrollmentsController } from './controllers/admin-enrollments.controller';
import { StudentEnrollmentsController } from './controllers/student-enrollments.controller';
import { EnrollmentsRepository } from './repositories/enrollments.repository';
import { EnrollmentsService } from './services/enrollments.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [StudentEnrollmentsController, AdminEnrollmentsController],
  providers: [EnrollmentsRepository, EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
