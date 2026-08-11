import { Injectable } from '@nestjs/common';
import type { AnalyticsQueryDto } from '../dto/analytics.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';

@Injectable()
export class PromotionAnalyticsService {
  constructor(private readonly repository: PromotionsRepository) {}

  async overview(query: AnalyticsQueryDto) {
    const limit = query.limit ?? 5;
    const [overview, topCampaigns, topAffiliates, topReferralCodes] =
      await Promise.all([
        this.repository.analyticsOverview(),
        this.repository.topCampaigns(limit),
        this.repository.topAffiliates(limit),
        this.repository.topReferralCodes(limit),
      ]);
    return { ...overview, topCampaigns, topAffiliates, topReferralCodes };
  }
}
