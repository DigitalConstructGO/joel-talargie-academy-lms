import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { PaymentListQueryDto, SubmitPaymentDto } from '../dto/payments.dto';
import { PaymentsService } from '../services/payments.service';

@Controller()
@ApiTags('Student Payments', 'Payment Receipts')
@ApiBearerAuth()
@Roles('STUDENT')
export class StudentPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('me/enrollments/:enrollmentId/payment-instructions')
  @ApiOperation({
    summary:
      'Get safe manual-payment instructions and immutable expected amount',
  })
  instructions(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) id: string,
  ) {
    return this.payments.instructions(user, id);
  }

  @Post('me/enrollments/:enrollmentId/payments')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: 12 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['transactionId', 'submittedAmount', 'currency', 'receipt'],
      properties: {
        transactionId: { type: 'string' },
        submittedAmount: { type: 'string', example: '2500.00' },
        currency: { type: 'string', example: 'ETB' },
        paymentDate: { type: 'string', format: 'date-time' },
        studentNote: { type: 'string' },
        receipt: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Submit one private bank-transfer receipt for review',
  })
  submit(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) id: string,
    @Body() dto: SubmitPaymentDto,
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    return this.payments.submit(user, id, dto, receipt);
  }

  @Get('me/enrollments/:enrollmentId/payments')
  @ApiOperation({
    summary: 'List preserved payment attempts for one owned enrollment',
  })
  enrollmentPayments(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) id: string,
    @Query() query: PaymentListQueryDto,
  ) {
    return this.payments.enrollmentPayments(user.id, id, query);
  }

  @Get('me/payments')
  @ApiOperation({ summary: 'List the authenticated Student payment history' })
  mine(@CurrentUser() user: AuthUser, @Query() query: PaymentListQueryDto) {
    return this.payments.mine(user.id, query);
  }

  // Declared before `me/payments/:paymentId` so "count" is not captured as a
  // payment id.
  @Get('me/payments/count')
  @ApiOperation({
    summary: 'Count the authenticated Student payments (optionally by status)',
  })
  count(@CurrentUser() user: AuthUser, @Query() query: PaymentListQueryDto) {
    return this.payments.mineCount(user.id, query);
  }

  @Get('me/payments/:paymentId/receipt')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Get a short-lived URL for an owned private receipt',
  })
  receipt(
    @CurrentUser() user: AuthUser,
    @Param('paymentId', ParseUUIDPipe) id: string,
  ) {
    return this.payments.mineReceipt(user.id, id);
  }

  @Get('me/payments/:paymentId')
  @ApiOperation({
    summary: 'Get one owned payment attempt without private review notes',
  })
  detail(
    @CurrentUser() user: AuthUser,
    @Param('paymentId', ParseUUIDPipe) id: string,
  ) {
    return this.payments.mineDetail(user.id, id);
  }
}
