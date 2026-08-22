import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../common/database/database.module';
import { MailModule } from '../../common/mail/mail.module';
import {
  AdminEmailDeliveriesController,
  EmailTemplatesController,
  MyNotificationsController,
  NotificationHealthController,
} from './controllers/notifications.controllers';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { NotificationsRepository } from './repositories/notifications.repository';
import { EmailRenderingService } from './services/email-rendering.service';
import { NotificationsService } from './services/notifications.service';
import { EmailWorkerService } from './workers/email-worker.service';
import { SmsWorkerService } from './workers/sms-worker.service';

@Module({
  imports: [DatabaseModule, MailModule, JwtModule.register({})],
  controllers: [
    MyNotificationsController,
    AdminEmailDeliveriesController,
    EmailTemplatesController,
    NotificationHealthController,
  ],
  providers: [
    NotificationsRepository,
    EmailRenderingService,
    NotificationsGateway,
    NotificationsService,
    EmailWorkerService,
    SmsWorkerService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
