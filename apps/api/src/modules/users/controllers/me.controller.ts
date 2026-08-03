import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import {
  RevokeSessionsDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from '../dto/users.dto';
import { UsersService } from '../services/users.service';
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}
  @ApiTags('My Profile') @Get('profile') profile(
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.ownProfile(user.id);
  }
  @ApiTags('My Profile') @Patch('profile') update(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(user, user.id, dto);
  }
  @ApiTags('My Profile') @Get('account') account(
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.ownProfile(user.id);
  }
  @ApiTags('My Sessions') @Get('sessions') sessions(
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.sessions(user.id, user.sessionId);
  }
  @ApiTags('My Sessions') @Delete('sessions/:sessionId') async revoke(
    @CurrentUser() user: AuthUser,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.users.revoke(user, user.id, sessionId);
    if (sessionId === user.sessionId)
      response.clearCookie('refresh_token', { path: '/' });
    return { message: 'Session revoked' };
  }
  @ApiTags('My Sessions') @Delete('sessions') async revokeAll(
    @CurrentUser() user: AuthUser,
    @Body() dto: RevokeSessionsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const keep = dto.includeCurrentSession ? undefined : user.sessionId;
    const count = await this.users.revokeAll(user, user.id, keep);
    if (dto.includeCurrentSession)
      response.clearCookie('refresh_token', { path: '/' });
    return {
      revokedSessions: count,
      logoutRequired: dto.includeCurrentSession,
    };
  }
  @ApiTags('My Profile') @Get('authentication-providers') async providers(
    @CurrentUser() user: AuthUser,
  ) {
    return (await this.users.profile(user.id)).authenticationProviders;
  }
  @ApiTags('User Preferences') @Get('notification-preferences') preferences(
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.preferences(user.id);
  }
  @ApiTags('User Preferences')
  @Patch('notification-preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.users.updatePreferences(user.id, dto);
  }
}
