import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type {
  CreateAffiliateDto,
  ListAffiliatesDto,
  UpdateAffiliateDto,
} from '../dto/affiliate.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';

@Injectable()
export class AffiliatesService {
  constructor(private readonly repository: PromotionsRepository) {}

  create(actor: AuthUser, dto: CreateAffiliateDto) {
    return this.repository.createAffiliate(actor.id, dto);
  }

  list(query: ListAffiliatesDto) {
    return this.repository.listAffiliates(query);
  }

  async get(id: string) {
    const affiliate = await this.repository.findAffiliate(id);
    if (!affiliate)
      throw new NotFoundException({
        code: 'AFFILIATE_NOT_FOUND',
        message: 'Affiliate not found',
      });
    return affiliate;
  }

  async update(id: string, dto: UpdateAffiliateDto) {
    await this.get(id);
    return this.repository.updateAffiliate(id, dto);
  }
}
