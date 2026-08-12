import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { PromotionEngineService } from '../engine/promotion-engine.service';
import {
  computeAffiliateCommission,
  computeReferrerReward,
} from '../engine/rules/reward.rules';
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
import {
  generateSecureCode,
  normalizeCouponCode,
} from '../utils/coupon-code.util';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

const EXPIRED_REASONS = new Set(['CAMPAIGN_EXPIRED', 'COUPON_EXPIRED']);

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
    await this.logOutcome(user.id, dto, result, meta);
    if (!result.valid)
      throw new UnprocessableEntityException({
        code: result.reasonCode,
        message: result.message,
      });
    const campaign = await this.repository.findCampaign(result.campaignId!);
    const requiresApproval = campaign?.requiresApproval ?? false;
    const {
      referralOwnerId,
      referrerRewardAmount,
      affiliateId,
      affiliateCommission,
    } = await this.resolveRewards(user.id, result, campaign ?? null);
    let redemption;
    try {
      redemption = await this.repository.recordRedemption({
        campaignId: result.campaignId!,
        codeId: result.codeId,
        studentId: user.id,
        courseId: dto.courseId,
        status: requiresApproval ? 'RESERVED' : 'CONFIRMED',
        originalPrice: result.pricing.originalPrice,
        discountAmount: result.pricing.discountAmount,
        finalPrice: result.pricing.finalPrice,
        currency: result.pricing.currency,
        referralOwnerId,
        referrerRewardAmount,
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
          code: 'USAGE_LIMIT_REACHED',
          message: 'This coupon has reached its usage limit',
        });
      throw error;
    }
    await this.repository.logUsage({
      campaignId: result.campaignId,
      codeId: result.codeId,
      actorId: user.id,
      action: 'COUPON_REDEEMED',
      metadata: {
        redemptionId: redemption.id,
        finalPrice: result.pricing.finalPrice,
        pendingApproval: requiresApproval,
      },
      ipAddress: meta.ipAddress,
    });
    return {
      ...result,
      redemptionId: redemption.id,
      redemptionStatus: redemption.status,
      pendingApproval: requiresApproval,
      redeemedAt: redemption.redeemedAt,
    };
  }

  async history(userId: string, query: ListRedemptionsDto) {
    return this.repository.listMyRedemptions(userId, query);
  }

  /**
   * Students "receive" a referral code lazily on first request rather than
   * at registration time - avoids minting codes for students who never use
   * the feature, and requires no change to the registration flow.
   */
  async myReferralCode(userId: string) {
    const campaign = await this.repository.findActiveReferralCampaign();
    if (!campaign)
      throw new NotFoundException({
        code: 'REFERRAL_PROGRAM_UNAVAILABLE',
        message: 'No active referral program is configured',
      });
    const { code, created } = await this.repository.findOrCreateReferralCode(
      campaign.id,
      userId,
      () => generateSecureCode({ length: 8, prefix: 'REF' }),
    );
    if (created)
      await this.repository.logUsage({
        campaignId: campaign.id,
        actorId: userId,
        action: 'COUPON_GENERATED',
        metadata: { code, codeType: 'REFERRAL', selfService: true },
      });
    return { code, campaignId: campaign.id, campaignName: campaign.name };
  }

  private async resolveRewards(
    userId: string,
    result: PromotionValidationResult,
    campaign: Awaited<ReturnType<PromotionsRepository['findCampaign']>> | null,
  ) {
    let referralOwnerId: string | null = null;
    let referrerRewardAmount: number | null = null;
    let affiliateId: string | null = null;
    let affiliateCommission: number | null = null;
    if (!result.codeId)
      return {
        referralOwnerId,
        referrerRewardAmount,
        affiliateId,
        affiliateCommission,
      };
    const code = await this.repository.findCode(result.codeId);
    if (
      code?.codeType === 'REFERRAL' &&
      code.ownerUserId &&
      code.ownerUserId !== userId &&
      campaign
    )
      referralOwnerId = code.ownerUserId;
    if (referralOwnerId && campaign)
      referrerRewardAmount = computeReferrerReward(
        campaign.referrerRewardType,
        campaign.referrerRewardValue,
        result.pricing,
      );
    if (code?.affiliateId) {
      affiliateId = code.affiliateId;
      const affiliate = await this.repository.findAffiliate(affiliateId);
      if (affiliate)
        affiliateCommission = computeAffiliateCommission(
          affiliate,
          result.pricing,
        );
    }
    return {
      referralOwnerId,
      referrerRewardAmount,
      affiliateId,
      affiliateCommission,
    };
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
    const [requested, automaticCandidates, userIsNewStudent] =
      await Promise.all([
        normalizedCode
          ? this.repository.findRuleSetByCode(normalizedCode, user.id)
          : null,
        normalizedCode
          ? []
          : this.repository.findAutomaticCandidates(dto.courseId, user.id),
        this.repository.isNewStudent(user.id),
      ]);
    if (requested?.promoCode?.affiliateId)
      await this.repository.recordAffiliateClick(
        requested.promoCode.affiliateId,
      );
    const input: PromotionValidationInput = {
      user: { id: user.id, email: user.email, roles: user.roles },
      course,
      code: normalizedCode,
      country: dto.country,
      paymentMethod: dto.paymentMethod,
      now: new Date(),
      userIsNewStudent,
    };
    const data: PromotionValidationData = { requested, automaticCandidates };
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
      campaignId: result.campaignId,
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
