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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  ActivityQueryDto,
  ListUsersQueryDto,
  PermanentDeleteUserDto,
  UserActionReasonDto,
  UpdateProfileDto,
} from '../dto/users.dto';
import { UsersService } from '../services/users.service';
@ApiTags('Administrator Users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}
  @Get() @RequirePermissions('users.read') list(
    @Query() query: ListUsersQueryDto,
  ) {
    return this.users.list(query);
  }
  @Get(':userId') @RequirePermissions('users.read') detail(
    @Param('userId', new ParseUUIDPipe()) id: string,
  ) {
    return this.users.detail(id);
  }
  @Patch(':userId/profile') @RequirePermissions('users.update') update(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(actor, id, dto, true);
  }
  @Post(':userId/activate') @RequirePermissions('users.activate') activate(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) id: string,
  ) {
    return this.users.transition(
      actor.id,
      id,
      'ACTIVE',
      undefined,
      'admin.user.activated',
    );
  }
  @Post(':userId/suspend')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequirePermissions('users.suspend')
  suspend(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Body() dto: UserActionReasonDto,
  ) {
    return this.users.transition(
      actor.id,
      id,
      'SUSPENDED',
      dto.reason,
      'admin.user.suspended',
    );
  }
  @Delete(':userId') @RequirePermissions('users.archive') archive(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Body() dto: UserActionReasonDto,
  ) {
    return this.users.transition(
      actor.id,
      id,
      'ARCHIVED',
      dto.reason,
      'admin.user.archived',
    );
  }
  @Delete(':userId/permanent')
  @RequirePermissions('users.delete_permanent')
  permanentlyDelete(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Body() dto: PermanentDeleteUserDto,
  ) {
    return this.users.permanentlyDelete(actor.id, id, dto.reason, false);
  }
  @Post(':userId/restore') @RequirePermissions('users.restore') restore(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) id: string,
  ) {
    return this.users.transition(
      actor.id,
      id,
      'ACTIVE',
      undefined,
      'admin.user.restored',
    );
  }
  @Get(':userId/activity') @RequirePermissions('users.view_activity') activity(
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.users.activity(id, query);
  }
  @Post(':userId/send-password-reset')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @RequirePermissions('users.trigger_password_reset')
  reset(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) id: string,
  ) {
    return this.users.triggerReset(actor.id, id);
  }
}
