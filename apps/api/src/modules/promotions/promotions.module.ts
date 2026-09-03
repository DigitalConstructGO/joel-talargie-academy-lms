import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AdminAffiliatesController } from './controllers/admin-affiliates.controller';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { AdminPromotionAnalyticsController } from './controllers/admin-promotion-analytics.controller';
import { StudentPromotionsController } from './controllers/student-promotions.controller';
import { PromotionEngineService } from './engine/promotion-engine.service';
import { PromotionsRepository } from './repositories/promotions.repository';
import { AffiliatesService } from './services/affiliates.service';
import { PromotionAnalyticsService } from './services/analytics.service';
import { CouponsService } from './services/coupons.service';
import { RedemptionService } from './services/redemption.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    StudentPromotionsController,
    AdminCouponsController,
    AdminAffiliatesController,
    AdminPromotionAnalyticsController,
  ],
  providers: [
    PromotionsRepository,
    PromotionEngineService,
    CouponsService,
    RedemptionService,
    AffiliatesService,
    PromotionAnalyticsService,
  ],
  exports: [PromotionEngineService, PromotionsRepository, RedemptionService],
})
export class PromotionsModule {}
