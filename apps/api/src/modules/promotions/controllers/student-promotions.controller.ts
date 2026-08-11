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

/**
 * Owns only static paths under /promotions - safe to register anywhere
 * relative to AdminCampaignsController's wildcard :id route, but kept early
 * in promotions.module.ts for readability alongside the other static-path
 * controllers.
 */
@Controller('promotions')
@ApiTags('My Promotions')
@ApiBearerAuth()
@Roles('STUDENT')
export class StudentPromotionsController {
  constructor(private readonly redemption: RedemptionService) {}

  @Post('validate')
  @HttpCode(200)
  @Throttle({ default: REDEMPTION_VALIDATION_THROTTLE })
  @ApiOperation({
    summary:
      'Check whether a coupon (or an automatic promotion) applies to a course',
    description:
      'Always returns 200 with { valid, reasonCode, pricing }. Never throws for an invalid/expired/ineligible coupon - only for a missing course.',
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
    summary: 'Redeem a coupon (or the best automatic promotion) for a course',
    description:
      'Records a redemption ledger entry. Returns 422 if the coupon is not valid.',
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

  @Get('referral-code')
  @ApiOperation({ summary: 'Get (or lazily create) my personal referral code' })
  referralCode(@CurrentUser() user: AuthUser) {
    return this.redemption.myReferralCode(user.id);
  }
}

function meta(request: Request) {
  return { ipAddress: request.ip, userAgent: request.get('user-agent') };
}
