import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type { ListRedemptionsDto } from '../dto/redemption.dto';
import { PromotionsRepository } from '../repositories/promotions.repository';

/**
 * The scholarship / requires-approval workflow. A redemption sits as
 * RESERVED (no usage counters applied yet) until an administrator approves
 * or rejects it - see PromotionsRepository.confirmRedemption/rejectRedemption.
 */
@Injectable()
export class ApprovalService {
  constructor(private readonly repository: PromotionsRepository) {}

  pending(query: ListRedemptionsDto) {
    return this.repository.listPendingRedemptions(
      query.page ?? 1,
      query.pageSize ?? 20,
    );
  }

  async approve(actor: AuthUser, redemptionId: string) {
    try {
      const redemption = await this.repository.confirmRedemption(
        redemptionId,
        actor.id,
      );
      await this.repository.logUsage({
        campaignId: redemption.campaignId,
        codeId: redemption.codeId,
        actorId: actor.id,
        action: 'COUPON_REDEEMED',
        metadata: { redemptionId, approved: true },
      });
      return redemption;
    } catch (error) {
      this.map(error);
    }
  }

  async reject(actor: AuthUser, redemptionId: string, reason: string) {
    try {
      const redemption = await this.repository.rejectRedemption(
        redemptionId,
        actor.id,
        reason,
      );
      await this.repository.logUsage({
        campaignId: redemption.campaignId,
        codeId: redemption.codeId,
        actorId: actor.id,
        action: 'COUPON_VALIDATION_FAILED',
        metadata: { redemptionId, rejected: true, reason },
      });
      return redemption;
    } catch (error) {
      this.map(error);
    }
  }

  private map(error: unknown): never {
    const value = String(error);
    if (value.includes('REDEMPTION_NOT_FOUND'))
      throw new NotFoundException({
        code: 'REDEMPTION_NOT_FOUND',
        message: 'Redemption not found',
      });
    if (value.includes('REDEMPTION_NOT_PENDING'))
      throw new ConflictException({
        code: 'REDEMPTION_NOT_PENDING',
        message: 'This redemption is not awaiting approval',
      });
    throw error;
  }
}
