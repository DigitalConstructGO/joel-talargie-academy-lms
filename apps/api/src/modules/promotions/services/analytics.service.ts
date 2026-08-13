import { Injectable } from '@nestjs/common';
import type { AnalyticsQueryDto } from '../dto/analytics.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';

@Injectable()
export class PromotionAnalyticsService {
  constructor(private readonly repository: PromotionsRepository) {}

  async overview(query: AnalyticsQueryDto) {
    const limit = query.limit ?? 5;
    const [overview, topCodes, topAffiliates] = await Promise.all([
      this.repository.analyticsOverview(),
      this.repository.topCodes(limit),
      this.repository.topAffiliates(limit),
    ]);
    return { ...overview, topCodes, topAffiliates };
  }
}
