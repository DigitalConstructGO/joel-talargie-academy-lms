import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AdminPaymentMethodsController } from './controllers/admin-payment-methods.controller';
import { StudentPaymentMethodsController } from './controllers/student-payment-methods.controller';
import { PaymentMethodsRepository } from './repositories/payment-methods.repository';
import { PaymentMethodsService } from './services/payment-methods.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminPaymentMethodsController, StudentPaymentMethodsController],
  providers: [PaymentMethodsRepository, PaymentMethodsService],
  exports: [PaymentMethodsService, PaymentMethodsRepository],
})
export class PaymentMethodsModule {}
