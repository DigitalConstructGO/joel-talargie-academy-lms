import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type {
  CreateCouponDto,
  GenerateCouponsDto,
  ListCouponsDto,
  UpdateCouponDto,
} from '../dto/coupon.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';
import {
  generateBulkCodes,
  generateSecureCode,
  normalizeCouponCode,
} from '../utils/coupon-code.util';

const MAX_MANUAL_GENERATION_ATTEMPTS = 10;

@Injectable()
export class CouponsService {
  constructor(private readonly repository: PromotionsRepository) {}

  async create(actor: AuthUser, dto: CreateCouponDto) {
    await this.requireCampaign(dto.campaignId);
    const code = dto.code
      ? await this.claimNormalizedCode(dto.code)
      : await this.generateUniqueCode({});
    const row = await this.repository.createCode(actor.id, { ...dto, code });
    await this.repository.logUsage({
      campaignId: dto.campaignId,
      codeId: row.id,
      actorId: actor.id,
      action: 'COUPON_GENERATED',
      metadata: { code: row.code, manual: !!dto.code },
    });
    return row;
  }

  async generate(actor: AuthUser, dto: GenerateCouponsDto) {
    await this.requireCampaign(dto.campaignId);
    const codes = await this.generateUniqueBatch(dto.count, {
      length: dto.length,
      prefix: dto.prefix,
      suffix: dto.suffix,
      excludeAmbiguous: dto.excludeAmbiguousCharacters,
    });
    const rows = await this.repository.bulkCreateCodes(
      actor.id,
      dto.campaignId,
      codes,
      dto,
    );
    await this.repository.logUsage({
      campaignId: dto.campaignId,
      actorId: actor.id,
      action: 'COUPON_GENERATED',
      metadata: { count: rows.length, bulk: true },
    });
    return rows;
  }

  async list(query: ListCouponsDto) {
    return this.repository.listCodes(query);
  }

  async get(id: string) {
    const code = await this.repository.findCode(id);
    if (!code) throw this.notFound();
    return code;
  }

  async update(actor: AuthUser, id: string, dto: UpdateCouponDto) {
    await this.get(id);
    const row = await this.repository.updateCode(id, dto);
    await this.repository.logUsage({
      codeId: id,
      campaignId: row.campaignId,
      actorId: actor.id,
      action: 'COUPON_UPDATED',
      metadata: { fields: Object.keys(dto) },
    });
    return row;
  }

  async archive(actor: AuthUser, id: string) {
    const existing = await this.get(id);
    const row = await this.repository.archiveCode(id);
    await this.repository.logUsage({
      codeId: id,
      campaignId: existing.campaignId,
      actorId: actor.id,
      action: 'COUPON_ARCHIVED',
    });
    return row;
  }

  private async requireCampaign(campaignId: string) {
    const campaign = await this.repository.findCampaign(campaignId);
    if (!campaign)
      throw new NotFoundException({
        code: 'CAMPAIGN_NOT_FOUND',
        message: 'Promotion campaign not found',
      });
    return campaign;
  }

  private async claimNormalizedCode(rawCode: string): Promise<string> {
    const code = normalizeCouponCode(rawCode);
    if (await this.repository.codeExists(code))
      throw new ConflictException({
        code: 'COUPON_CODE_TAKEN',
        message: 'This coupon code is already in use',
      });
    return code;
  }

  private async generateUniqueCode(options: {
    length?: number;
    prefix?: string;
    suffix?: string;
    excludeAmbiguous?: boolean;
  }): Promise<string> {
    for (
      let attempt = 0;
      attempt < MAX_MANUAL_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const candidate = generateSecureCode(options);
      if (!(await this.repository.codeExists(candidate))) return candidate;
    }
    throw new ConflictException({
      code: 'COUPON_CODE_GENERATION_FAILED',
      message:
        'Could not generate a unique coupon code, try a different prefix/length',
    });
  }

  private async generateUniqueBatch(
    count: number,
    options: {
      length?: number;
      prefix?: string;
      suffix?: string;
      excludeAmbiguous?: boolean;
    },
  ): Promise<string[]> {
    for (
      let attempt = 0;
      attempt < MAX_MANUAL_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const candidates = generateBulkCodes(count, options);
      const collisions = await Promise.all(
        candidates.map((code) => this.repository.codeExists(code)),
      );
      if (!collisions.some(Boolean)) return candidates;
    }
    throw new ConflictException({
      code: 'COUPON_CODE_GENERATION_FAILED',
      message:
        'Could not generate unique coupon codes, try a different prefix/length',
    });
  }

  private notFound() {
    return new NotFoundException({
      code: 'COUPON_NOT_FOUND',
      message: 'Coupon not found',
    });
  }
}
