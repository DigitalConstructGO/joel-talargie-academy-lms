import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { MailModule } from '../../common/mail/mail.module';
import {
  AdminEmailDeliveriesController,
  EmailTemplatesController,
  MyNotificationsController,
  NotificationHealthController,
} from './controllers/notifications.controllers';
import { NotificationsRepository } from './repositories/notifications.repository';
import { EmailRenderingService } from './services/email-rendering.service';
import { NotificationsService } from './services/notifications.service';
import { EmailWorkerService } from './workers/email-worker.service';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [
    MyNotificationsController,
    AdminEmailDeliveriesController,
    EmailTemplatesController,
    NotificationHealthController,
  ],
  providers: [
    NotificationsRepository,
    EmailRenderingService,
    NotificationsService,
    EmailWorkerService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
