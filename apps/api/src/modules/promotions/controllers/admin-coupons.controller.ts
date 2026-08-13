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
  CreateCouponDto,
  ListCouponsDto,
  UpdateCouponDto,
} from '../dto/coupon.dto';
import { ListCodeRedemptionsDto } from '../dto/redemption.dto';
import { CouponsService } from '../services/coupons.service';

@Controller('promotions')
@ApiTags('Administrator Coupons')
@ApiBearerAuth()
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Post('coupons')
  @RequirePermissions('promotions.manage_coupons')
  @ApiOperation({
    summary: 'Create a single coupon (manual code or auto-generated)',
  })
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateCouponDto) {
    return this.coupons.create(actor, dto);
  }

  @Get('coupons')
  @RequirePermissions('promotions.read')
  @ApiOperation({ summary: 'List coupons' })
  list(@Query() query: ListCouponsDto) {
    return this.coupons.list(query);
  }

  @Get('coupons/:id')
  @RequirePermissions('promotions.read')
  @ApiOperation({
    summary: 'Get a coupon with its targeting rules and validity status',
  })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.detail(id);
  }

  @Get('coupons/:id/redemptions')
  @RequirePermissions('promotions.read')
  @ApiOperation({ summary: 'List real redemption history for a coupon' })
  redemptions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListCodeRedemptionsDto,
  ) {
    return this.coupons.redemptions(id, query);
  }

  @Patch('coupons/:id')
  @RequirePermissions('promotions.manage_coupons')
  @ApiOperation({
    summary: 'Update a coupon (status, limits, validity window)',
  })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.coupons.update(actor, id, dto);
  }

  @Delete('coupons/:id')
  @RequirePermissions('promotions.manage_coupons')
  @ApiOperation({ summary: 'Revoke a coupon' })
  archive(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coupons.archive(actor, id);
  }
}
