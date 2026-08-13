import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type {
  CreateCouponDto,
  ListCouponsDto,
  UpdateCouponDto,
} from '../dto/coupon.dto';
import type { ListCodeRedemptionsDto } from '../dto/redemption.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';
import {
  generateSecureCode,
  normalizeCouponCode,
} from '../utils/coupon-code.util';

const MAX_MANUAL_GENERATION_ATTEMPTS = 10;

@Injectable()
export class CouponsService {
  constructor(private readonly repository: PromotionsRepository) {}

  async create(actor: AuthUser, dto: CreateCouponDto) {
    const code = dto.code
      ? await this.claimNormalizedCode(dto.code)
      : await this.generateUniqueCode({});
    const row = await this.repository.createCode(actor.id, { ...dto, code });
    await this.repository.logUsage({
      codeId: row.id,
      actorId: actor.id,
      action: 'COUPON_GENERATED',
      metadata: { code: row.code, manual: !!dto.code },
    });
    return row;
  }

  async list(query: ListCouponsDto) {
    return this.repository.listCodes(query);
  }

  async get(id: string) {
    const code = await this.repository.findCode(id);
    if (!code) throw this.notFound();
    return code;
  }

  /**
   * Composed admin detail view: the coupon, its own targeting rules, and its
   * current validity status. This is the display snapshot only - real
   * validation still runs through the engine.
   */
  async detail(id: string) {
    const found = await this.repository.findCodeWithRules(id);
    if (!found) throw this.notFound();
    const { code, rules } = found;
    const now = new Date();

    let validityStatus: 'NOT_STARTED' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE' | 'REVOKED';
    if (code.status === 'REVOKED') {
      validityStatus = 'REVOKED';
    } else if (code.status === 'PAUSED') {
      validityStatus = 'INACTIVE';
    } else if (code.status === 'EXPIRED') {
      validityStatus = 'EXPIRED';
    } else if (code.validFrom && now < code.validFrom) {
      validityStatus = 'NOT_STARTED';
    } else if (code.validUntil && now >= code.validUntil) {
      validityStatus = 'EXPIRED';
    } else {
      validityStatus = 'ACTIVE';
    }

    return { ...code, validityStatus, rules };
  }

  async redemptions(id: string, query: ListCodeRedemptionsDto) {
    await this.get(id);
    return this.repository.listCodeRedemptions(id, query);
  }

  async update(actor: AuthUser, id: string, dto: UpdateCouponDto) {
    await this.get(id);
    const row = await this.repository.updateCode(id, dto);
    await this.repository.logUsage({
      codeId: id,
      actorId: actor.id,
      action: 'COUPON_UPDATED',
      metadata: { fields: Object.keys(dto) },
    });
    return row;
  }

  async archive(actor: AuthUser, id: string) {
    await this.get(id);
    const row = await this.repository.archiveCode(id);
    await this.repository.logUsage({
      codeId: id,
      actorId: actor.id,
      action: 'COUPON_ARCHIVED',
    });
    return row;
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

  private notFound() {
    return new NotFoundException({
      code: 'COUPON_NOT_FOUND',
      message: 'Coupon not found',
    });
  }
}
