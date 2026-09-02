import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { NotificationsService } from '../../notifications/services/notifications.service';
import type {
  ActivityQueryDto,
  ListUsersQueryDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from '../dto/users.dto';
import { UsersRepository } from '../repositories/users.repository';
@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly auth: AuthService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}
  async profile(id: string) {
    const user = await this.repository.safe(id);
    if (!user)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    return user;
  }
  async ownProfile(id: string) {
    const [user, preferences] = await Promise.all([
      this.profile(id),
      this.repository.preferences(id),
    ]);
    return { ...user, notificationPreferences: preferences };
  }
  updateProfile(
    actor: AuthUser,
    targetId: string,
    dto: UpdateProfileDto,
    admin = false,
  ) {
    return this.repository.profile({
      actorId: actor.id,
      userId: targetId,
      ...dto,
      action: admin ? 'admin.user_profile.updated' : 'user.profile.updated',
    });
  }
  preferences(id: string) {
    return this.repository.preferences(id);
  }
  updatePreferences(id: string, dto: UpdatePreferencesDto) {
    return this.repository.updatePreferences(id, dto);
  }
  async sessions(userId: string, current?: string) {
    return (await this.repository.sessions(userId)).map((session) => ({
      ...session,
      ipAddress: session.ipAddress?.replace(/\.\d+$/, '.***'),
      deviceName:
        session.userAgent?.split(' ').slice(0, 3).join(' ') ?? 'Unknown device',
      currentSession: session.id === current,
    }));
  }
  async revoke(
    actor: AuthUser,
    target: string,
    sessionId: string,
    admin = false,
  ) {
    try {
      const revoked = await this.repository.revoke({
        actorId: actor.id,
        userId: target,
        sessionId,
        admin,
      });
      if (admin) await this.notifySessionRevoked(target, revoked);
      return revoked;
    } catch (error) {
      // The repository throws plain, code-named errors (no HTTP framework
      // dependency in the shared database package) - translate the known
      // ones here so a missing/foreign/already-revoked session ID surfaces
      // as a proper 404/409 instead of falling through to an unhandled 500.
      if (error instanceof Error && error.message === 'SESSION_NOT_FOUND')
        throw new NotFoundException({
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        });
      if (error instanceof Error && error.message === 'SESSION_ALREADY_REVOKED')
        throw new ConflictException({
          code: 'SESSION_ALREADY_REVOKED',
          message: 'Session already revoked',
        });
      throw error;
    }
  }
  async revokeAll(
    actor: AuthUser,
    target: string,
    keep: string | undefined,
    admin = false,
  ) {
    const revoked = await this.repository.revokeAll({
      actorId: actor.id,
      userId: target,
      keepSessionId: keep,
      admin,
    });
    if (admin) await this.notifySessionsRevokedAll(target);
    return revoked;
  }
  list(query: ListUsersQueryDto) {
    return this.repository.list({
      search: query.search,
      status: query.status,
      role: query.role,
      provider: query.provider,
      emailVerified: query.emailVerified,
      includeArchived: query.includeArchived,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }
  async detail(id: string) {
    const [user, summary, preferences] = await Promise.all([
      this.profile(id),
      this.repository.summary(id),
      this.repository.preferences(id),
    ]);
    return { ...user, ...summary, notificationPreferences: preferences };
  }
  async transition(
    actorId: string,
    userId: string,
    target: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED',
    reason: string | undefined,
    action: string,
  ) {
    let status: string;
    try {
      status = await this.repository.transition({
        actorId,
        userId,
        target,
        reason,
        action,
      });
    } catch (error) {
      const value = String(error);
      if (value.includes('USER_NOT_FOUND'))
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      if (value.includes('CANNOT_MODIFY'))
        throw new ForbiddenException({
          code: 'CANNOT_MODIFY_OWN_STATUS',
          message: 'You cannot change your own account status',
        });
      if (value.includes('LAST_ADMINISTRATOR'))
        throw new ConflictException({
          code: 'LAST_ADMINISTRATOR_PROTECTED',
          message: 'The last active Administrator is protected',
        });
      if (value.includes('INVALID_STATUS'))
        throw new ConflictException({
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Invalid account status transition',
        });
      if (value.includes('REASON_REQUIRED'))
        throw new BadRequestException('A reason is required');
      throw error;
    }
    await this.notifyAccountStatus(userId, action);
    return status;
  }
  activity(userId: string, query: ActivityQueryDto) {
    return this.repository.activity({
      userId,
      action: query.action,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }
  async triggerReset(actorId: string, userId: string) {
    const user = await this.profile(userId);
    await this.auth.forgotPassword(user.email);
    return {
      message:
        'If password login is available, reset instructions have been created.',
    };
  }
  async permanentlyDelete(
    actorId: string,
    targetId: string,
    reason?: string,
    isSelf = false,
  ) {
    try {
      return await this.repository.permanentlyDelete({
        actorId,
        userId: targetId,
        reason,
        isSelf,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND')
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      if (error instanceof Error && error.message === 'LAST_ADMINISTRATOR')
        throw new BadRequestException({
          code: 'LAST_ADMINISTRATOR',
          message: 'Cannot delete the last administrator',
        });
      throw error;
    }
  }
  private accountStatusTemplate(action: string): string | null {
    const mapping: Record<string, string> = {
      'admin.user.activated': 'ACCOUNT_ACTIVATED',
      'admin.user.suspended': 'ACCOUNT_SUSPENDED',
      'admin.user.archived': 'ACCOUNT_ARCHIVED',
      'admin.user.restored': 'ACCOUNT_RESTORED',
    };
    return mapping[action] ?? null;
  }
  private accountStatusTitle(templateCode: string): string {
    const titles: Record<string, string> = {
      ACCOUNT_ACTIVATED: 'Account activated',
      ACCOUNT_SUSPENDED: 'Account suspended',
      ACCOUNT_ARCHIVED: 'Account archived',
      ACCOUNT_RESTORED: 'Account restored',
    };
    return titles[templateCode] ?? 'Account status changed';
  }
  private async notifyAccountStatus(userId: string, action: string) {
    const templateCode = this.accountStatusTemplate(action);
    if (!templateCode) return;
    try {
      const user = await this.repository.safe(userId);
      if (!user?.email) return;
      await this.notifications.notify({
        userId,
        recipientEmail: user.email,
        recipientName: user.fullName?.trim() || user.firstName || 'Student',
        templateCode,
        variables: {
          recipientName: user.firstName || 'Student',
          academyName: 'Joel Talargie Academy',
          supportEmail:
            this.config.get('EMAIL_SUPPORT_ADDRESS') || 'academy support',
        },
        deduplicationKey: `account-status:${userId}:${action}:${Date.now()}`,
        category: 'security',
        title: this.accountStatusTitle(templateCode),
        message: 'Your academy account status has changed.',
        actionUrl: '/dashboard',
        priority: 'HIGH',
      });
    } catch {
      // Email failures must never break the account transition itself.
    }
  }
  private async notifySessionRevoked(userId: string, sessionId: string) {
    try {
      const user = await this.repository.safe(userId);
      if (!user?.email) return;
      await this.notifications.notify({
        userId,
        recipientEmail: user.email,
        recipientName: user.fullName?.trim() || user.firstName || 'Student',
        templateCode: 'SESSION_REVOKED_BY_ADMIN',
        variables: {
          recipientName: user.firstName || 'Student',
          academyName: 'Joel Talargie Academy',
          supportEmail:
            this.config.get('EMAIL_SUPPORT_ADDRESS') || 'academy support',
        },
        deduplicationKey: `session-revoked:${userId}:${sessionId}`,
        category: 'security',
        title: 'Session revoked by administrator',
        message: 'An administrator signed one of your active sessions out.',
        actionUrl: '/dashboard/security',
        priority: 'CRITICAL',
      });
    } catch {
      // Email failures must never break the session revocation itself.
    }
  }
  private async notifySessionsRevokedAll(userId: string) {
    try {
      const user = await this.repository.safe(userId);
      if (!user?.email) return;
      await this.notifications.notify({
        userId,
        recipientEmail: user.email,
        recipientName: user.fullName?.trim() || user.firstName || 'Student',
        templateCode: 'SESSION_REVOKED_BY_ADMIN',
        variables: {
          recipientName: user.firstName || 'Student',
          academyName: 'Joel Talargie Academy',
          supportEmail:
            this.config.get('EMAIL_SUPPORT_ADDRESS') || 'academy support',
        },
        deduplicationKey: `sessions-revoked:${userId}:${Date.now()}`,
        category: 'security',
        title: 'Sessions revoked by administrator',
        message: 'An administrator signed out all of your active sessions.',
        actionUrl: '/dashboard/security',
        priority: 'CRITICAL',
      });
    } catch {
      // Email failures must never break the session revocation itself.
    }
  }
}
