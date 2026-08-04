import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AdminAffiliatesController } from './controllers/admin-affiliates.controller';
import { AdminCampaignsController } from './controllers/admin-campaigns.controller';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { AdminPromotionAnalyticsController } from './controllers/admin-promotion-analytics.controller';
import { AdminRedemptionsController } from './controllers/admin-redemptions.controller';
import { StudentPromotionsController } from './controllers/student-promotions.controller';
import { PromotionEngineService } from './engine/promotion-engine.service';
import { PromotionsRepository } from './repositories/promotions.repository';
import { AffiliatesService } from './services/affiliates.service';
import { PromotionAnalyticsService } from './services/analytics.service';
import { ApprovalService } from './services/approval.service';
import { CampaignsService } from './services/campaigns.service';
import { CouponsService } from './services/coupons.service';
import { RedemptionService } from './services/redemption.service';

@Module({
  imports: [DatabaseModule],
  // Order matters: every controller here owns only static paths under
  // /promotions except AdminCampaignsController, which owns the wildcard
  // GET/PATCH/DELETE /promotions/:id. Express/Nest resolve routes in
  // registration order, not by specificity, so the wildcard controller MUST
  // be registered last or it would shadow /promotions/coupons,
  // /promotions/analytics, /promotions/history, /promotions/referral-code,
  // /promotions/affiliates, and /promotions/redemptions.
  controllers: [
    StudentPromotionsController,
    AdminCouponsController,
    AdminAffiliatesController,
    AdminPromotionAnalyticsController,
    AdminRedemptionsController,
    AdminCampaignsController,
  ],
  providers: [
    PromotionsRepository,
    PromotionEngineService,
    CampaignsService,
    CouponsService,
    RedemptionService,
    AffiliatesService,
    PromotionAnalyticsService,
    ApprovalService,
  ],
  exports: [PromotionEngineService, PromotionsRepository],
})
export class PromotionsModule {}
