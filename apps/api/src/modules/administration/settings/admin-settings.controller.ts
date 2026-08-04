import { Body, Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { PlatformSettingsService } from './platform-settings.service';
import {
  SettingsQueryDto,
  UpdateSettingDto,
  UpdateSettingsBatchDto,
} from './settings.dto';
@Controller('admin/settings')
@ApiTags('Platform Settings', 'Setting History')
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(private readonly service: PlatformSettingsService) {}
  private auth(r: Request) {
    const a = (r as any).authorization;
    return {
      permissions: a?.permissions ?? [],
      admin: a?.isAdministrator ?? false,
    };
  }
  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({
    summary:
      'List backend-registered, typed platform settings; environment secrets are excluded',
  })
  list(@Query() q: SettingsQueryDto) {
    return this.service.list(q);
  }
  @Put()
  @RequirePermissions('settings.update')
  @ApiOperation({
    summary: 'Atomically update a validated batch with a required reason',
  })
  batch(
    @CurrentUser() u: AuthUser,
    @Body() d: UpdateSettingsBatchDto,
    @Req() r: Request,
  ) {
    const a = this.auth(r);
    return this.service.batch(u.id, d.items, d.reason, a.permissions, a.admin);
  }
  @Get(':key/history')
  @RequirePermissions('settings.view_history')
  @ApiOperation({ summary: 'View immutable setting-change history' })
  history(@Param('key') key: string) {
    return this.service.history(key);
  }
  @Get(':key') @RequirePermissions('settings.read') get(
    @Param('key') key: string,
  ) {
    return this.service.get(key);
  }
  @Put(':key')
  @RequirePermissions('settings.update')
  @ApiOperation({
    summary:
      'Update one registered setting with type, business-rule, and environment-bound validation',
  })
  update(
    @CurrentUser() u: AuthUser,
    @Param('key') key: string,
    @Body() d: UpdateSettingDto,
    @Req() r: Request,
  ) {
    const a = this.auth(r);
    return this.service.update(
      u.id,
      key,
      d.value,
      d.reason,
      a.permissions,
      a.admin,
    );
  }
}
