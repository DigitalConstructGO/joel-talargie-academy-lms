import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { ListRedemptionsDto, RejectRedemptionDto } from '../dto/redemption.dto';
import { ApprovalService } from '../services/approval.service';

/**
 * Scholarship / requires-approval queue. Nested under /promotions/redemptions
 * (depth-2), so it never collides with the /promotions/:id wildcard owned by
 * AdminCampaignsController regardless of registration order.
 */
@Controller('promotions/redemptions')
@ApiTags('Promotion Approvals')
@ApiBearerAuth()
export class AdminRedemptionsController {
  constructor(private readonly approvals: ApprovalService) {}

  @Get('pending')
  @RequirePermissions('promotions.read')
  @ApiOperation({
    summary: 'List redemptions awaiting scholarship/approval review',
  })
  pending(@Query() query: ListRedemptionsDto) {
    return this.approvals.pending(query);
  }

  @Post(':id/approve')
  @RequirePermissions('promotions.approve_redemptions')
  @ApiOperation({
    summary:
      'Approve a pending redemption - only now are usage counters applied',
  })
  approve(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.approvals.approve(actor, id);
  }

  @Post(':id/reject')
  @RequirePermissions('promotions.approve_redemptions')
  @ApiOperation({ summary: 'Reject a pending redemption' })
  reject(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectRedemptionDto,
  ) {
    return this.approvals.reject(actor, id, dto.reason);
  }
}
