import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  changeUserPassword,
  consumeEmailVerification,
  consumePasswordReset,
  createPasswordReset,
  createRefreshSession,
  createStudentUser,
  findAuthUserByEmail,
  findAuthUserById,
  findRefreshSession,
  recordLoginAttempt,
  revokeRefreshSession,
  rotateRefreshSession,
  updateLastLogin,
  upsertGoogleUser,
} from '@joel-academy/database';
import { DatabaseService } from '../../common/database/database.service';
import { PasswordHasherService } from '../../common/security/password-hasher.service';
import { AuditService } from '../audit/audit.service';
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import type {
  AuthUser,
  GoogleProfile,
  JwtPayload,
} from './interfaces/auth-user.interface';
import { hashToken, secureToken } from './utils/token.util';

const accessSeconds = 15 * 60;
const refreshSeconds = 7 * 24 * 60 * 60;
@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly passwords: PasswordHasherService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
  private safe(user: Awaited<ReturnType<typeof findAuthUserById>>): AuthUser {
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      emailVerified: user.emailVerified,
    };
  }
  private signAccess(user: AuthUser) {
    const payload: JwtPayload = {
      id: user.id,
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: accessSeconds,
    });
  }
  private signRefresh(user: AuthUser, sid: string) {
    const payload: JwtPayload = {
      id: user.id,
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sid,
      type: 'refresh',
      jti: secureToken(),
    };
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: refreshSeconds,
    });
  }
  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword)
      throw new BadRequestException('Passwords do not match');
    const email = this.normalizeEmail(dto.email);
    if (await findAuthUserByEmail(this.database.client, email))
      throw new ConflictException('An account with this email already exists');
    const verificationToken = secureToken();
    let user;
    try {
      user = await createStudentUser(this.database.client, {
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        passwordHash: await this.passwords.hashPassword(dto.password),
        tokenHash: hashToken(verificationToken),
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    } catch (error) {
      if (String(error).includes('unique'))
        throw new ConflictException(
          'An account with this email already exists',
        );
      throw error;
    }
    await this.audit.logCreate('user', user.id, {
      email: user.email,
      roles: user.roles,
    });
    return {
      user: this.safe(user),
      verificationToken:
        this.config.get('NODE_ENV') === 'production'
          ? undefined
          : verificationToken,
      message: 'Registration successful. Verify your email before logging in.',
    };
  }
  async login(dto: LoginDto, meta: { ipAddress?: string; userAgent?: string }) {
    const email = this.normalizeEmail(dto.email);
    const user = await findAuthUserByEmail(this.database.client, email);
    const valid = user
      ? await this.passwords.verifyPassword(dto.password, user.passwordHash)
      : false;
    await recordLoginAttempt(this.database.client, {
      userId: user?.id,
      emailNormalized: email,
      successful: valid,
      ...meta,
    });
    if (!user || !valid)
      throw new UnauthorizedException('Invalid email or password');
    if (user.status !== 'ACTIVE')
      throw new UnauthorizedException(
        user.status === 'PENDING'
          ? 'Verify your email before logging in'
          : 'Account is unavailable',
      );
    const safe = this.safe(user);
    const placeholder = hashToken(secureToken());
    const sessionId = await createRefreshSession(this.database.client, {
      userId: user.id,
      tokenHash: placeholder,
      expiresAt: new Date(Date.now() + refreshSeconds * 1000),
    });
    const refreshToken = this.signRefresh(safe, sessionId);
    await rotateRefreshSession(
      this.database.client,
      sessionId,
      hashToken(refreshToken),
      new Date(Date.now() + refreshSeconds * 1000),
    );
    await Promise.all([
      updateLastLogin(this.database.client, user.id),
      this.audit.logLogin(user.id, meta),
    ]);
    return { user: safe, accessToken: this.signAccess(safe), refreshToken };
  }
  async loginWithGoogle(
    profile: GoogleProfile,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    if (!profile.emailVerified)
      throw new UnauthorizedException(
        'Google account must have a verified email',
      );
    const user = await upsertGoogleUser(this.database.client, {
      googleId: profile.googleId,
      email: this.normalizeEmail(profile.email),
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      passwordHash: await this.passwords.hashPassword(secureToken()),
    });
    const safe = this.safe(user);
    const sessionId = await createRefreshSession(this.database.client, {
      userId: user.id,
      tokenHash: hashToken(secureToken()),
      expiresAt: new Date(Date.now() + refreshSeconds * 1000),
    });
    const refreshToken = this.signRefresh(safe, sessionId);
    await rotateRefreshSession(
      this.database.client,
      sessionId,
      hashToken(refreshToken),
      new Date(Date.now() + refreshSeconds * 1000),
    );
    await Promise.all([
      updateLastLogin(this.database.client, user.id),
      this.audit.logLogin(user.id, meta),
    ]);
    return { user: safe, accessToken: this.signAccess(safe), refreshToken };
  }
  async refresh(token: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh' || !payload.sid)
      throw new UnauthorizedException('Invalid refresh token');
    const session = await findRefreshSession(this.database.client, payload.sid);
    if (!session || session.tokenHash !== hashToken(token))
      throw new UnauthorizedException('Refresh session is invalid');
    const user = await findAuthUserById(this.database.client, payload.sub);
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException();
    const safe = this.safe(user);
    const refreshToken = this.signRefresh(safe, payload.sid);
    const rotated = await rotateRefreshSession(
      this.database.client,
      payload.sid,
      hashToken(refreshToken),
      new Date(Date.now() + refreshSeconds * 1000),
    );
    if (!rotated) throw new UnauthorizedException();
    return { user: safe, accessToken: this.signAccess(safe), refreshToken };
  }
  async logout(token: string | undefined, user: AuthUser) {
    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
          secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        });
        if (payload.sid)
          await revokeRefreshSession(this.database.client, payload.sid);
      } catch {
        // Logout is idempotent even when the refresh cookie is already invalid.
      }
    }
    await this.audit.logLogout(user.id);
    return { message: 'Logged out successfully' };
  }
  async verifyEmail(token: string) {
    if (
      !(await consumeEmailVerification(this.database.client, hashToken(token)))
    )
      throw new BadRequestException('Verification token is invalid or expired');
    return { message: 'Email verified successfully' };
  }
  async forgotPassword(emailValue: string) {
    const user = await findAuthUserByEmail(
      this.database.client,
      this.normalizeEmail(emailValue),
    );
    let resetToken: string | undefined;
    if (user) {
      resetToken = secureToken();
      await createPasswordReset(this.database.client, {
        userId: user.id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    }
    return {
      message:
        'If the account exists, password reset instructions have been created.',
      resetToken:
        this.config.get('NODE_ENV') === 'production' ? undefined : resetToken,
    };
  }
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword)
      throw new BadRequestException('Passwords do not match');
    const id = await consumePasswordReset(
      this.database.client,
      hashToken(dto.token),
      await this.passwords.hashPassword(dto.password),
    );
    if (!id) throw new BadRequestException('Reset token is invalid or expired');
    await this.audit.logCustom({
      actorId: id,
      action: 'PASSWORD_RESET',
      entityType: 'user',
      entityId: id,
    });
    return { message: 'Password reset successfully' };
  }
  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword)
      throw new BadRequestException('Passwords do not match');
    const stored = await findAuthUserById(this.database.client, user.id);
    if (
      !stored ||
      !(await this.passwords.verifyPassword(
        dto.currentPassword,
        stored.passwordHash,
      ))
    )
      throw new UnauthorizedException('Current password is incorrect');
    await changeUserPassword(
      this.database.client,
      user.id,
      await this.passwords.hashPassword(dto.newPassword),
    );
    await this.audit.logCustom({
      actorId: user.id,
      action: 'PASSWORD_CHANGE',
      entityType: 'user',
      entityId: user.id,
    });
    return { message: 'Password changed. Sign in again.' };
  }
  async profile(id: string) {
    return this.safe(await findAuthUserById(this.database.client, id));
  }
}
