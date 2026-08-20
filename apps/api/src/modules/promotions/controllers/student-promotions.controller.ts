import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import {
  REDEMPTION_THROTTLE,
  REDEMPTION_VALIDATION_THROTTLE,
} from '../constants/promotion.constants';
import {
  ListRedemptionsDto,
  RedeemCouponDto,
  ValidateCouponDto,
} from '../dto/redemption.dto';
import { RedemptionService } from '../services/redemption.service';

@Controller('promotions')
@ApiTags('My Promotions')
@ApiBearerAuth()
@Roles('STUDENT', 'ADMINISTRATOR', 'INSTRUCTOR', 'STAFF')
export class StudentPromotionsController {
  constructor(private readonly redemption: RedemptionService) {}

  @Post('validate')
  @HttpCode(200)
  @Throttle({ default: REDEMPTION_VALIDATION_THROTTLE })
  @ApiOperation({
    summary: 'Check whether a promo code applies to a course',
    description:
      'Always returns 200 with { valid, reasonCode, pricing }. Never throws for an invalid/expired/ineligible code - only for a missing course.',
  })
  validate(
    @CurrentUser() user: AuthUser,
    @Body() dto: ValidateCouponDto,
    @Req() request: Request,
  ) {
    return this.redemption.validate(user, dto, meta(request));
  }

  @Post('redeem')
  @HttpCode(200)
  @Throttle({ default: REDEMPTION_THROTTLE })
  @ApiOperation({
    summary: 'Redeem a promo code for a course',
    description:
      'Records a redemption ledger entry. Returns 422 if the code is not valid.',
  })
  redeem(
    @CurrentUser() user: AuthUser,
    @Body() dto: RedeemCouponDto,
    @Req() request: Request,
  ) {
    return this.redemption.redeem(user, dto, meta(request));
  }

  @Get('history')
  @ApiOperation({ summary: 'View my own redemption history' })
  history(@CurrentUser() user: AuthUser, @Query() query: ListRedemptionsDto) {
    return this.redemption.history(user.id, query);
  }
}

function meta(request: Request) {
  return { ipAddress: request.ip, userAgent: request.get('user-agent') };
}
