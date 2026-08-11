import { Controller, Delete, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { UsersService } from '../services/users.service';
@ApiTags('Administrator User Sessions')
@ApiBearerAuth()
@Controller('admin/users/:userId/sessions')
export class AdminUserSessionsController {
  constructor(private readonly users: UsersService) {}
  @Get() @RequirePermissions('users.view_sessions') list(
    @Param('userId', new ParseUUIDPipe()) id: string,
  ) {
    return this.users.sessions(id);
  }
  @Delete(':sessionId')
  @RequirePermissions('users.revoke_sessions')
  async revoke(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
  ) {
    await this.users.revoke(actor, userId, sessionId, true);
    return { message: 'Session revoked' };
  }
  @Delete() @RequirePermissions('users.revoke_sessions') async all(
    @CurrentUser() actor: AuthUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return {
      revokedSessions: await this.users.revokeAll(
        actor,
        userId,
        undefined,
        true,
      ),
    };
  }
}
