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
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  CreateCouponDto,
  GenerateCouponsDto,
  ListCouponsDto,
  UpdateCouponDto,
} from '../dto/coupon.dto';
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

  @Post('generate')
  @RequirePermissions('promotions.generate_coupons')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Bulk-generate secure random coupon codes for a campaign',
  })
  generate(@CurrentUser() actor: AuthUser, @Body() dto: GenerateCouponsDto) {
    return this.coupons.generate(actor, dto);
  }

  @Get('coupons')
  @RequirePermissions('promotions.read')
  @ApiOperation({ summary: 'List coupons' })
  list(@Query() query: ListCouponsDto) {
    return this.coupons.list(query);
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
