import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  CreatePaymentMethodDto,
  ListPaymentMethodsDto,
  SetPaymentMethodStatusDto,
  UpdatePaymentMethodDto,
} from '../dto/payment-methods.dto';
import { PaymentMethodsService } from '../services/payment-methods.service';

@Controller('admin/payment-methods')
@ApiTags('Administrator Payment Methods')
@ApiBearerAuth()
export class AdminPaymentMethodsController {
  constructor(private readonly methods: PaymentMethodsService) {}

  @Get()
  @RequirePermissions('payment_methods.read')
  @ApiOperation({
    summary: 'Search and filter the DB-backed payment-methods catalog',
  })
  list(@Query() query: ListPaymentMethodsDto) {
    return this.methods.list(query);
  }

  @Get(':paymentMethodId')
  @RequirePermissions('payment_methods.read')
  @ApiOperation({ summary: 'View one payment method including admin config' })
  detail(@Param('paymentMethodId', ParseUUIDPipe) id: string) {
    return this.methods.adminDetail(id);
  }

  @Post()
  @RequirePermissions('payment_methods.create')
  @ApiOperation({ summary: 'Create a new payment method' })
  create(
    @CurrentUser() actor: AuthUser,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return this.methods.create(actor, dto);
  }

  @Patch(':paymentMethodId')
  @RequirePermissions('payment_methods.update')
  @ApiOperation({ summary: 'Update a payment method' })
  update(
    @Param('paymentMethodId', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.methods.update(id, dto);
  }

  @Patch(':paymentMethodId/status')
  @RequirePermissions('payment_methods.update')
  @ApiOperation({ summary: 'Activate or deactivate a payment method' })
  status(
    @Param('paymentMethodId', ParseUUIDPipe) id: string,
    @Body() dto: SetPaymentMethodStatusDto,
  ) {
    return this.methods.setActive(id, dto.isActive);
  }

  @Delete(':paymentMethodId')
  @RequirePermissions('payment_methods.delete')
  @ApiOperation({
    summary: 'Delete a payment method that no payment references',
  })
  remove(@Param('paymentMethodId', ParseUUIDPipe) id: string) {
    return this.methods.remove(id);
  }
}
