import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeezSmsProvider } from './providers/geez-sms.provider';
import { LoggerSmsProvider } from './providers/logger-sms.provider';
import { SMS_SERVICE } from './sms.interface';
import { SmsService } from './sms.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    GeezSmsProvider,
    LoggerSmsProvider,
    SmsService,
    {
      provide: SMS_SERVICE,
      useExisting: SmsService,
    },
  ],
  exports: [SmsService, SMS_SERVICE],
})
export class SmsModule {}
