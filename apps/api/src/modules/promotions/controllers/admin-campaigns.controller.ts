import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  CreateCampaignDto,
  ListCampaignsDto,
  UpdateCampaignDto,
} from '../dto/campaign.dto';
import { CampaignsService } from '../services/campaigns.service';

/**
 * Owns the wildcard `GET/PATCH/DELETE /promotions/:id` routes - registered
 * LAST in promotions.module.ts so every static sibling route (coupons,
 * validate, redeem, history, analytics, affiliates, referral-code) resolves
 * first. Express/Nest match routes in registration order, not by
 * specificity, so this ordering is load-bearing - see the module file.
 */
@Controller('promotions')
@ApiTags('Administrator Promotions')
@ApiBearerAuth()
export class AdminCampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Post()
  @RequirePermissions('promotions.create')
  @ApiOperation({ summary: 'Create a promotion campaign' })
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateCampaignDto) {
    return this.campaigns.create(actor, dto);
  }

  @Get()
  @RequirePermissions('promotions.read')
  @ApiOperation({ summary: 'List promotion campaigns' })
  list(@Query() query: ListCampaignsDto) {
    return this.campaigns.list(query);
  }

  @Get(':id')
  @RequirePermissions('promotions.read')
  @ApiOperation({
    summary: 'Get one promotion campaign with its eligibility rules',
  })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.get(id);
  }

  @Patch(':id')
  @RequirePermissions('promotions.update')
  @ApiOperation({ summary: 'Update a promotion campaign' })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaigns.update(actor, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('promotions.archive')
  @ApiOperation({ summary: 'Archive a promotion campaign (soft delete)' })
  archive(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaigns.archive(actor, id);
  }
}
