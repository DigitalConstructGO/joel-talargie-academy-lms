import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
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
import {
  AssignRolePermissionsDto,
  CreateRoleDto,
  ListRolesQueryDto,
  UpdateRoleDto,
} from '../dto/role.dto';
import { RolesService } from '../services/roles.service';
@ApiTags('Roles')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}
  @Get() @RequirePermissions('roles.read') list(
    @Query() query: ListRolesQueryDto,
  ) {
    return this.roles.list(query);
  }
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @RequirePermissions('roles.create')
  @ApiConflictResponse()
  @ApiOperation({
    summary:
      'Create a custom role; supplied permissions must be held by the actor',
  })
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateRoleDto) {
    return this.roles.create(actor.id, dto);
  }
  @Get(':roleId')
  @RequirePermissions('roles.read')
  @ApiNotFoundResponse()
  details(@Param('roleId', new ParseUUIDPipe()) id: string) {
    return this.roles.details(id);
  }
  @Patch(':roleId') @RequirePermissions('roles.update') update(
    @CurrentUser() actor: AuthUser,
    @Param('roleId', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roles.update(actor.id, id, dto);
  }
  @Put(':roleId/permissions')
  @RequirePermissions('roles.assign_permissions')
  @ApiOperation({
    summary:
      'Replace a custom role permission set with privilege-escalation protection',
  })
  permissions(
    @CurrentUser() actor: AuthUser,
    @Param('roleId', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return this.roles.replacePermissions(actor.id, id, dto.permissionIds);
  }
  @Delete(':roleId')
  @RequirePermissions('roles.archive')
  @ApiOperation({
    summary: 'Archive a custom role; system roles are protected',
  })
  archive(
    @CurrentUser() actor: AuthUser,
    @Param('roleId', new ParseUUIDPipe()) id: string,
  ) {
    return this.roles.archive(actor.id, id);
  }
}
