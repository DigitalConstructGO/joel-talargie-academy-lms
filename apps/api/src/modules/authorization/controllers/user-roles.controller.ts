import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AssignUserRoleDto } from '../dto/role.dto';
import { UserRolesService } from '../services/user-roles.service';
@ApiTags('User Roles')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiNotFoundResponse()
@Controller('admin/users/:userId/roles')
export class UserRolesController {
  constructor(private readonly roles: UserRolesService) {}
  @Get() @RequirePermissions('users.read') list(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.roles.list(userId);
  }
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @RequirePermissions('users.assign_roles')
  @ApiConflictResponse()
  @ApiOperation({
    summary: 'Assign an active role with privilege-escalation protection',
  })
  assign(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: AssignUserRoleDto,
  ) {
    return this.roles.assign(actor.id, userId, dto.roleId);
  }
  @Delete(':roleId')
  @RequirePermissions('users.assign_roles')
  @ApiOperation({
    summary: 'Remove a role; last Administrator and Student role are protected',
  })
  remove(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
  ) {
    return this.roles.remove(actor.id, userId, roleId);
  }
}
