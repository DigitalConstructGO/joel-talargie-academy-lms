import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminLearningController } from './controllers/admin-learning.controller';
import { StudentLearningController } from './controllers/student-learning.controller';
import { LearningRepository } from './repositories/learning.repository';
import { LearningService } from './services/learning.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [StudentLearningController, AdminLearningController],
  providers: [LearningRepository, LearningService],
})
export class LearningModule {}
