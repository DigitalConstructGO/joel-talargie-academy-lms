import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { AnalyticsQueryDto } from '../dto/analytics.dto';
import { PromotionAnalyticsService } from '../services/analytics.service';

@Controller('promotions/analytics')
@ApiTags('Promotion Analytics')
@ApiBearerAuth()
@RequirePermissions('promotions.view_analytics')
export class AdminPromotionAnalyticsController {
  constructor(private readonly analytics: PromotionAnalyticsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Code/coupon counts, revenue, discount given, conversion rate, and top codes/affiliates',
  })
  overview(@Query() query: AnalyticsQueryDto) {
    return this.analytics.overview(query);
  }
}
