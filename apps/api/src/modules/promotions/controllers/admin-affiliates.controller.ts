import {
  Body,
  Controller,
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
  CreateAffiliateDto,
  ListAffiliatesDto,
  UpdateAffiliateDto,
} from '../dto/affiliate.dto';
import { AffiliatesService } from '../services/affiliates.service';

/**
 * Not in the original literal endpoint list, but required for the Affiliate
 * System objective to be usable end-to-end: without an admin surface to
 * create/manage affiliate profiles, coupons could never be issued with a
 * valid `affiliateId`. See the final report's "API Endpoints" section.
 */
@Controller('promotions/affiliates')
@ApiTags('Administrator Affiliates')
@ApiBearerAuth()
@RequirePermissions('promotions.manage_affiliates')
export class AdminAffiliatesController {
  constructor(private readonly affiliates: AffiliatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an affiliate profile' })
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateAffiliateDto) {
    return this.affiliates.create(actor, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List affiliates ordered by total revenue' })
  list(@Query() query: ListAffiliatesDto) {
    return this.affiliates.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one affiliate profile with running totals' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.affiliates.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an affiliate profile (status, commission)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAffiliateDto,
  ) {
    return this.affiliates.update(id, dto);
  }
}
