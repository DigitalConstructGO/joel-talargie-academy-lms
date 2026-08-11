import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  ApprovePaymentDto,
  DeclinePaymentDto,
  PaymentActivityQueryDto,
  PaymentListQueryDto,
} from '../dto/payments.dto';
import { PaymentsService } from '../services/payments.service';

@Controller('admin/payments')
@ApiTags('Administrator Payments', 'Payment Review', 'Payment Receipts')
@ApiBearerAuth()
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @RequirePermissions('payments.read')
  @ApiOperation({
    summary: 'Search and filter the bounded payment-review queue',
  })
  list(@Query() query: PaymentListQueryDto) {
    return this.payments.adminList(query);
  }

  @Get(':paymentId/receipt')
  @RequirePermissions('payments.view_receipts')
  @ApiOperation({ summary: 'Get a short-lived private receipt URL' })
  receipt(@Param('paymentId', ParseUUIDPipe) id: string) {
    return this.payments.adminReceipt(id);
  }

  @Get(':paymentId/duplicate-transactions')
  @RequirePermissions('payments.read_sensitive')
  @ApiOperation({
    summary: 'View safe matching transaction-reference warnings',
  })
  duplicates(@Param('paymentId', ParseUUIDPipe) id: string) {
    return this.payments.duplicates(id);
  }

  @Post(':paymentId/approve')
  @RequirePermissions('payments.approve')
  @ApiOperation({
    summary: 'Approve one locked pending payment and grant enrollment access',
  })
  approve(
    @CurrentUser() actor: AuthUser,
    @Param('paymentId', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePaymentDto,
  ) {
    return this.payments.approve(actor.id, id, dto);
  }

  @Post(':paymentId/decline')
  @RequirePermissions('payments.decline')
  @ApiOperation({
    summary: 'Decline one locked pending payment with a required reason',
  })
  decline(
    @CurrentUser() actor: AuthUser,
    @Param('paymentId', ParseUUIDPipe) id: string,
    @Body() dto: DeclinePaymentDto,
  ) {
    return this.payments.decline(actor.id, id, dto);
  }

  @Get(':paymentId/activity')
  @RequirePermissions('payments.view_activity')
  @ApiOperation({
    summary: 'View bounded payment submission and review activity',
  })
  activity(
    @Param('paymentId', ParseUUIDPipe) id: string,
    @Query() query: PaymentActivityQueryDto,
  ) {
    return this.payments.activity(id, query);
  }

  @Get(':paymentId')
  @RequirePermissions('payments.read')
  @ApiOperation({
    summary: 'View safe payment, Student, course, and review details',
  })
  detail(@Param('paymentId', ParseUUIDPipe) id: string) {
    return this.payments.adminDetail(id);
  }
}
