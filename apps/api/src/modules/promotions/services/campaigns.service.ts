import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type {
  CreateCampaignDto,
  ListCampaignsDto,
  UpdateCampaignDto,
} from '../dto/campaign.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';

@Injectable()
export class CampaignsService {
  constructor(private readonly repository: PromotionsRepository) {}

  async create(actor: AuthUser, dto: CreateCampaignDto) {
    const campaign = await this.repository.createCampaign(actor.id, dto);
    await this.repository.logUsage({
      campaignId: campaign.id,
      actorId: actor.id,
      action: 'CAMPAIGN_CREATED',
      metadata: { name: campaign.name, type: campaign.type },
    });
    return this.present(campaign);
  }

  async list(query: ListCampaignsDto) {
    const result = await this.repository.listCampaigns(query);
    return { ...result, items: result.items.map((item) => this.present(item)) };
  }

  async get(id: string) {
    const campaign = await this.repository.findCampaign(id);
    if (!campaign) throw this.notFound();
    const rules = await this.repository.campaignRules(id);
    return { ...this.present(campaign), rules };
  }

  async update(actor: AuthUser, id: string, dto: UpdateCampaignDto) {
    await this.get(id);
    const campaign = await this.repository.updateCampaign(id, dto);
    await this.repository.logUsage({
      campaignId: id,
      actorId: actor.id,
      action: 'CAMPAIGN_UPDATED',
      metadata: { fields: Object.keys(dto) },
    });
    return this.present(campaign);
  }

  async archive(actor: AuthUser, id: string) {
    await this.get(id);
    const campaign = await this.repository.archiveCampaign(id);
    await this.repository.logUsage({
      campaignId: id,
      actorId: actor.id,
      action: 'CAMPAIGN_ARCHIVED',
    });
    return this.present(campaign);
  }

  private present<
    T extends { discountValue: string; maxDiscountAmount: string | null },
  >(campaign: T) {
    return {
      ...campaign,
      discountValue: Number(campaign.discountValue),
      maxDiscountAmount:
        campaign.maxDiscountAmount === null
          ? null
          : Number(campaign.maxDiscountAmount),
    };
  }

  private notFound() {
    return new NotFoundException({
      code: 'CAMPAIGN_NOT_FOUND',
      message: 'Promotion campaign not found',
    });
  }
}
