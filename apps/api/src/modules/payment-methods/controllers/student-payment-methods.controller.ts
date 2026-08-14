import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaymentMethodsService } from '../services/payment-methods.service';

@Controller('me/payment-methods')
@Roles('STUDENT')
@ApiTags('Student Payment Methods')
@ApiBearerAuth()
export class StudentPaymentMethodsController {
  constructor(private readonly methods: PaymentMethodsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List active payment methods with public display info only (never config)',
  })
  list() {
    return this.methods.listActive();
  }
}
