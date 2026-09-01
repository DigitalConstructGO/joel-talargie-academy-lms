import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { PromotionEngineService } from '../engine/promotion-engine.service';
import { computeAffiliateCommission } from '../engine/rules/reward.rules';
import type {
  PromotionValidationData,
  PromotionValidationInput,
  PromotionValidationResult,
} from '../interfaces/promotion.interface';
import type {
  ListRedemptionsDto,
  RedeemCouponDto,
  ValidateCouponDto,
} from '../dto/redemption.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { normalizeCouponCode } from '../utils/coupon-code.util';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

const EXPIRED_REASONS = new Set(['COUPON_EXPIRED']);

@Injectable()
export class RedemptionService {
  constructor(
    private readonly repository: PromotionsRepository,
    private readonly engine: PromotionEngineService,
  ) {}

  async validate(user: AuthUser, dto: ValidateCouponDto, meta: RequestMeta) {
    const result = await this.evaluate(user, dto);
    await this.logOutcome(user.id, dto, result, meta);
    return result;
  }

  async redeem(user: AuthUser, dto: RedeemCouponDto, meta: RequestMeta) {
    const result = await this.evaluate(user, dto);
    if (!result.valid)
      throw new UnprocessableEntityException({
        code: result.reasonCode,
        message: result.message,
      });
    const { affiliateId, affiliateCommission } =
      await this.resolveAffiliateRewards(result);
    let redemption;
    try {
      redemption = await this.repository.recordRedemption({
        codeId: result.codeId!,
        studentId: user.id,
        courseId: dto.courseId,
        originalPrice: result.pricing.originalPrice,
        discountAmount: result.pricing.discountAmount,
        finalPrice: result.pricing.finalPrice,
        currency: result.pricing.currency,
        affiliateId,
        affiliateCommission,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    } catch (error) {
      // The initial preview is deliberately non-consuming. A limit can be
      // reached by another checkout before this confirmed redemption starts.
      if (
        error instanceof Error &&
        error.message === 'PROMOTION_REDEMPTION_LIMIT_REACHED'
      )
        throw new UnprocessableEntityException({
          code: 'MAX_USERS_REACHED',
          message: 'This promo code has reached its usage limit',
        });
      throw error;
    }
    await this.repository.logUsage({
      codeId: result.codeId,
      actorId: user.id,
      action: 'COUPON_REDEEMED',
      metadata: {
        redemptionId: redemption.id,
        finalPrice: result.pricing.finalPrice,
      },
      ipAddress: meta.ipAddress,
    });
    return {
      ...result,
      redemptionId: redemption.id,
      redemptionStatus: redemption.status,
      redeemedAt: redemption.redeemedAt,
    };
  }

  async history(userId: string, query: ListRedemptionsDto) {
    return this.repository.listMyRedemptions(userId, query);
  }

  private async resolveAffiliateRewards(result: PromotionValidationResult) {
    let affiliateId: string | null = null;
    let affiliateCommission: number | null = null;
    if (result.codeId) {
      const code = await this.repository.findCode(result.codeId);
      if (code?.affiliateId) {
        affiliateId = code.affiliateId;
        const affiliate = await this.repository.findAffiliate(affiliateId!);
        if (affiliate)
          affiliateCommission = computeAffiliateCommission(
            affiliate,
            result.pricing,
          );
      }
    }
    return { affiliateId, affiliateCommission };
  }

  private async evaluate(
    user: AuthUser,
    dto: ValidateCouponDto,
  ): Promise<PromotionValidationResult> {
    const course = await this.repository.findCourseForEngine(dto.courseId);
    if (!course)
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    const normalizedCode = dto.code ? normalizeCouponCode(dto.code) : undefined;
    const requested = normalizedCode
      ? await this.repository.findRuleSetByCode(normalizedCode, user.id)
      : null;
    if (requested?.promoCode?.affiliateId)
      await this.repository.recordAffiliateClick(
        requested.promoCode.affiliateId,
      );
    const input: PromotionValidationInput = {
      user: { id: user.id, email: user.email, roles: user.roles },
      course,
      code: normalizedCode,
      now: new Date(),
    };
    const data: PromotionValidationData = { requested };
    return this.engine.evaluate(input, data);
  }

  private async logOutcome(
    actorId: string,
    dto: ValidateCouponDto,
    result: PromotionValidationResult,
    meta: RequestMeta,
  ) {
    if (result.valid) return;
    const action =
      result.reasonCode && EXPIRED_REASONS.has(result.reasonCode)
        ? 'COUPON_EXPIRED'
        : 'COUPON_VALIDATION_FAILED';
    await this.repository.logUsage({
      codeId: result.codeId,
      actorId,
      action,
      metadata: {
        reasonCode: result.reasonCode,
        courseId: dto.courseId,
        code: dto.code,
      },
      ipAddress: meta.ipAddress,
    });
  }
}
