import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminPaymentsController } from './controllers/admin-payments.controller';
import { StudentPaymentsController } from './controllers/student-payments.controller';
import { PaymentsRepository } from './repositories/payments.repository';
import { PaymentsService } from './services/payments.service';

@Module({
  imports: [DatabaseModule, StorageModule, NotificationsModule],
  controllers: [StudentPaymentsController, AdminPaymentsController],
  providers: [PaymentsRepository, PaymentsService],
})
export class PaymentsModule {}
