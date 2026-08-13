import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  changeUserPassword,
  consumeEmailVerification,
  consumePasswordReset,
  createPasswordReset,
  createStudentUser,
  findAuthUserByEmail,
  findAuthUserById,
  findRefreshSession,
  recordLoginAttempt,
  revokeRefreshSession,
  upsertGoogleUser,
  createRefreshSession,
  rotateRefreshSession,
} from '@joel-academy/database';
import { AuthService } from '../auth.service';
import { hashToken } from '../utils/token.util';
const user = {
  id: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
  email: 'student@example.com',
  passwordHash: 'hash',
  status: 'ACTIVE' as const,
  firstName: 'Test',
  lastName: 'Student',
  roles: ['STUDENT'],
  avatarUrl: null,
  provider: 'LOCAL' as const,
  emailVerified: true,
};
describe('AuthService', () => {
  const database = { client: {} };
  const passwords = {
    hashPassword: jest.fn().mockResolvedValue('hash'),
    verifyPassword: jest.fn().mockResolvedValue(true),
  };
  const jwt = new JwtService();
  const config = new ConfigService({
    NODE_ENV: 'test',
    JWT_ACCESS_SECRET: 'access-secret-that-is-at-least-32-characters',
    JWT_REFRESH_SECRET: 'refresh-secret-that-is-at-least-32-characters',
  });
  const audit = {
    logCreate: jest.fn(),
    logLogin: jest.fn(),
    logLogout: jest.fn(),
    logCustom: jest.fn(),
  };
  const notifications = { notify: jest.fn().mockResolvedValue(null) };
  const service = new AuthService(
    database as never,
    passwords as never,
    jwt,
    config,
    audit as never,
    notifications as never,
  );
  beforeEach(() => jest.clearAllMocks());
  it('rejects duplicate registration emails', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(user);
    await expect(
      service.register({
        firstName: 'Test',
        lastName: 'Student',
        email: 'STUDENT@example.com',
        password: 'Strong1!',
        confirmPassword: 'Strong1!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(findAuthUserByEmail).toHaveBeenCalledWith(
      database.client,
      'student@example.com',
    );
  });
  it('records and rejects a wrong password', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(user);
    passwords.verifyPassword.mockResolvedValueOnce(false);
    await expect(
      service.login({ email: user.email, password: 'wrong' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(recordLoginAttempt).toHaveBeenCalledWith(
      database.client,
      expect.objectContaining({ successful: false }),
    );
  });
  it('does not disclose whether forgot-password email exists', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(null);
    await expect(
      service.forgotPassword('missing@example.com'),
    ).resolves.toEqual(
      expect.objectContaining({
        message: expect.stringContaining('If the account exists'),
      }),
    );
  });
  it('uses the shared JWT and refresh-session flow for Google users', async () => {
    jest.mocked(upsertGoogleUser).mockResolvedValue({
      user: {
        ...user,
        provider: 'GOOGLE',
        avatarUrl: 'https://example.com/avatar.png',
      },
      event: 'EMAIL_LINKED',
    });
    jest.mocked(createRefreshSession).mockResolvedValue('session-id');
    jest.mocked(rotateRefreshSession).mockResolvedValue(true);
    const result = await service.loginWithGoogle(
      {
        googleId: 'google-123',
        email: 'STUDENT@EXAMPLE.COM',
        firstName: 'Test',
        lastName: 'Student',
        avatarUrl: 'https://example.com/avatar.png',
        emailVerified: true,
      },
      {},
    );
    expect(upsertGoogleUser).toHaveBeenCalledWith(
      database.client,
      expect.objectContaining({
        googleId: 'google-123',
        email: 'student@example.com',
      }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ templateCode: 'GOOGLE_ACCOUNT_LINKED' }),
    );
    expect(
      jwt.verify(result.accessToken, {
        secret: config.get('JWT_ACCESS_SECRET'),
      }),
    ).toEqual(
      expect.objectContaining({
        sub: user.id,
        roles: ['STUDENT'],
        type: 'access',
      }),
    );
    expect(result.refreshToken).toBeTruthy();
  });

  it('does not email a Google-linked notice for an existing Google identity', async () => {
    jest.mocked(upsertGoogleUser).mockResolvedValue({
      user: {
        ...user,
        provider: 'GOOGLE',
        avatarUrl: 'https://example.com/avatar.png',
      },
      event: 'GOOGLE_MATCH',
    });
    jest.mocked(createRefreshSession).mockResolvedValue('session-id');
    jest.mocked(rotateRefreshSession).mockResolvedValue(true);
    await service.loginWithGoogle(
      {
        googleId: 'google-123',
        email: 'STUDENT@EXAMPLE.COM',
        firstName: 'Test',
        lastName: 'Student',
        avatarUrl: 'https://example.com/avatar.png',
        emailVerified: true,
      },
      {},
    );
    expect(notifications.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ templateCode: 'GOOGLE_ACCOUNT_LINKED' }),
    );
  });
  it('rejects an unverified Google email', async () => {
    await expect(
      service.loginWithGoogle(
        {
          googleId: 'google-123',
          email: user.email,
          firstName: 'Test',
          lastName: 'Student',
          emailVerified: false,
        },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects mismatched confirmPassword on register', async () => {
    await expect(
      service.register({
        firstName: 'Test',
        lastName: 'Student',
        email: 'new@example.com',
        password: 'Strong1!',
        confirmPassword: 'Different1!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registers a new student, logs the creation, and emails a verification link', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(null);
    jest.mocked(createStudentUser).mockResolvedValue(user);
    const result = await service.register({
      firstName: '  Test  ',
      lastName: '  Student  ',
      email: '  STUDENT@example.com  ',
      password: 'Strong1!',
      confirmPassword: 'Strong1!',
    });
    expect(createStudentUser).toHaveBeenCalledWith(
      database.client,
      expect.objectContaining({
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'Student',
      }),
    );
    expect(audit.logCreate).toHaveBeenCalledWith('user', user.id, {
      email: user.email,
      roles: user.roles,
    });
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ templateCode: 'EMAIL_VERIFICATION' }),
    );
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('maps a unique-constraint violation on register to ConflictException', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(null);
    jest
      .mocked(createStudentUser)
      .mockRejectedValue(
        new Error('duplicate key value violates unique constraint'),
      );
    await expect(
      service.register({
        firstName: 'Test',
        lastName: 'Student',
        email: 'new@example.com',
        password: 'Strong1!',
        confirmPassword: 'Strong1!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows an unrelated error during registration', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(null);
    jest
      .mocked(createStudentUser)
      .mockRejectedValue(new Error('connection reset'));
    await expect(
      service.register({
        firstName: 'Test',
        lastName: 'Student',
        email: 'new@example.com',
        password: 'Strong1!',
        confirmPassword: 'Strong1!',
      }),
    ).rejects.toThrow('connection reset');
  });

  it('rejects login for an account pending email verification', async () => {
    jest
      .mocked(findAuthUserByEmail)
      .mockResolvedValue({ ...user, status: 'PENDING_VERIFICATION' });
    await expect(
      service.login({ email: user.email, password: 'Strong1!' }, {}),
    ).rejects.toThrow('Verify your email before logging in');
  });

  it('rejects login for a suspended account with a generic message', async () => {
    jest
      .mocked(findAuthUserByEmail)
      .mockResolvedValue({ ...user, status: 'SUSPENDED' });
    await expect(
      service.login({ email: user.email, password: 'Strong1!' }, {}),
    ).rejects.toThrow('Account is unavailable');
  });

  it('logs in successfully, creates a session, and returns valid tokens', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(user);
    jest.mocked(createRefreshSession).mockResolvedValue('session-1');
    jest.mocked(rotateRefreshSession).mockResolvedValue(true);
    const result = await service.login(
      { email: user.email, password: 'Strong1!' },
      { ipAddress: '203.0.113.5', userAgent: 'jest' },
    );
    expect(recordLoginAttempt).toHaveBeenCalledWith(
      database.client,
      expect.objectContaining({ successful: true }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ templateCode: 'NEW_LOGIN_ALERT' }),
    );
    expect(
      jwt.verify(result.accessToken, {
        secret: config.get('JWT_ACCESS_SECRET'),
      }),
    ).toEqual(expect.objectContaining({ sub: user.id, type: 'access' }));
  });

  describe('refresh', () => {
    it('rejects an unverifiable token', async () => {
      await expect(service.refresh('not-a-real-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a token that is not of type refresh', async () => {
      const accessToken = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          roles: user.roles,
          type: 'access',
        },
        { secret: config.get('JWT_REFRESH_SECRET'), expiresIn: 60 },
      );
      await expect(service.refresh(accessToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when no refresh session exists for the token', async () => {
      const refreshToken = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          roles: user.roles,
          type: 'refresh',
          sid: 'session-1',
          jti: 'jti-1',
        },
        { secret: config.get('JWT_REFRESH_SECRET'), expiresIn: 60 },
      );
      jest.mocked(findRefreshSession).mockResolvedValue(null as never);
      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the stored token hash does not match', async () => {
      const refreshToken = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          roles: user.roles,
          type: 'refresh',
          sid: 'session-1',
          jti: 'jti-1',
        },
        { secret: config.get('JWT_REFRESH_SECRET'), expiresIn: 60 },
      );
      jest
        .mocked(findRefreshSession)
        .mockResolvedValue({ tokenHash: 'a-different-hash' } as never);
      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the user no longer exists or is inactive', async () => {
      const refreshToken = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          roles: user.roles,
          type: 'refresh',
          sid: 'session-1',
          jti: 'jti-1',
        },
        { secret: config.get('JWT_REFRESH_SECRET'), expiresIn: 60 },
      );
      jest
        .mocked(findRefreshSession)
        .mockResolvedValue({ tokenHash: hashToken(refreshToken) } as never);
      jest.mocked(findAuthUserById).mockResolvedValue(null);
      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when session rotation reports the session was superseded', async () => {
      const refreshToken = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          roles: user.roles,
          type: 'refresh',
          sid: 'session-1',
          jti: 'jti-1',
        },
        { secret: config.get('JWT_REFRESH_SECRET'), expiresIn: 60 },
      );
      jest
        .mocked(findRefreshSession)
        .mockResolvedValue({ tokenHash: hashToken(refreshToken) } as never);
      jest.mocked(findAuthUserById).mockResolvedValue(user);
      jest.mocked(rotateRefreshSession).mockResolvedValue(false);
      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates the session and returns new tokens on success', async () => {
      const refreshToken = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          roles: user.roles,
          type: 'refresh',
          sid: 'session-1',
          jti: 'jti-1',
        },
        { secret: config.get('JWT_REFRESH_SECRET'), expiresIn: 60 },
      );
      jest
        .mocked(findRefreshSession)
        .mockResolvedValue({ tokenHash: hashToken(refreshToken) } as never);
      jest.mocked(findAuthUserById).mockResolvedValue(user);
      jest.mocked(rotateRefreshSession).mockResolvedValue(true);
      const result = await service.refresh(refreshToken);
      expect(result.user.id).toBe(user.id);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('revokes the session for a valid refresh token and logs the logout', async () => {
      const refreshToken = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          roles: user.roles,
          type: 'refresh',
          sid: 'session-1',
          jti: 'jti-1',
        },
        { secret: config.get('JWT_REFRESH_SECRET'), expiresIn: 60 },
      );
      const result = await service.logout(refreshToken, {
        id: user.id,
      } as never);
      expect(revokeRefreshSession).toHaveBeenCalledWith(
        database.client,
        'session-1',
      );
      expect(audit.logLogout).toHaveBeenCalledWith(user.id);
      expect(result.message).toBe('Logged out successfully');
    });

    it('is idempotent for a missing or invalid refresh token', async () => {
      const result = await service.logout('not-a-real-token', {
        id: user.id,
      } as never);
      expect(revokeRefreshSession).not.toHaveBeenCalled();
      expect(result.message).toBe('Logged out successfully');

      const withoutToken = await service.logout(undefined, {
        id: user.id,
      } as never);
      expect(withoutToken.message).toBe('Logged out successfully');
    });
  });

  describe('verifyEmail', () => {
    it('rejects an invalid or expired token', async () => {
      jest.mocked(consumeEmailVerification).mockResolvedValue(false);
      await expect(service.verifyEmail('bad-token')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('succeeds for a valid token', async () => {
      jest.mocked(consumeEmailVerification).mockResolvedValue(true);
      const result = await service.verifyEmail('good-token');
      expect(result.message).toBe('Email verified successfully');
    });
  });

  it('creates a reset token and emails it for a known account', async () => {
    jest.mocked(findAuthUserByEmail).mockResolvedValue(user);
    const result = await service.forgotPassword(user.email);
    expect(createPasswordReset).toHaveBeenCalledWith(
      database.client,
      expect.objectContaining({ userId: user.id }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ templateCode: 'PASSWORD_RESET' }),
    );
    expect(result.message).toContain('If the account exists');
  });

  describe('resetPassword', () => {
    it('rejects mismatched confirmation', async () => {
      await expect(
        service.resetPassword({
          token: 't',
          password: 'p1',
          confirmPassword: 'p2',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an invalid or expired reset token', async () => {
      jest.mocked(consumePasswordReset).mockResolvedValue(undefined as never);
      await expect(
        service.resetPassword({
          token: 'bad',
          password: 'Strong1!',
          confirmPassword: 'Strong1!',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resets the password, logs it, and notifies the user', async () => {
      jest.mocked(consumePasswordReset).mockResolvedValue(user.id);
      jest.mocked(findAuthUserById).mockResolvedValue(user);
      const result = await service.resetPassword({
        token: 'good',
        password: 'Strong1!',
        confirmPassword: 'Strong1!',
      });
      expect(audit.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET', actorId: user.id }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ templateCode: 'PASSWORD_CHANGED' }),
      );
      expect(result.message).toBe('Password reset successfully');
    });

    it('skips the notification when the changed user cannot be found afterward', async () => {
      jest.mocked(consumePasswordReset).mockResolvedValue(user.id);
      jest.mocked(findAuthUserById).mockResolvedValue(null);
      await service.resetPassword({
        token: 'good',
        password: 'Strong1!',
        confirmPassword: 'Strong1!',
      });
      expect(notifications.notify).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('rejects mismatched confirmation', async () => {
      await expect(
        service.changePassword(user as never, {
          currentPassword: 'x',
          newPassword: 'p1',
          confirmPassword: 'p2',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the stored user cannot be found', async () => {
      jest.mocked(findAuthUserById).mockResolvedValue(null);
      await expect(
        service.changePassword(user as never, {
          currentPassword: 'x',
          newPassword: 'Strong1!',
          confirmPassword: 'Strong1!',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect current password', async () => {
      jest.mocked(findAuthUserById).mockResolvedValue(user);
      passwords.verifyPassword.mockResolvedValueOnce(false);
      await expect(
        service.changePassword(user as never, {
          currentPassword: 'wrong',
          newPassword: 'Strong1!',
          confirmPassword: 'Strong1!',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('changes the password, logs it, and notifies the user', async () => {
      jest.mocked(findAuthUserById).mockResolvedValue(user);
      const result = await service.changePassword(user as never, {
        currentPassword: 'Strong1!',
        newPassword: 'NewStrong1!',
        confirmPassword: 'NewStrong1!',
      });
      expect(changeUserPassword).toHaveBeenCalledWith(
        database.client,
        user.id,
        'hash',
      );
      expect(audit.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_CHANGE' }),
      );
      expect(result.message).toBe('Password changed. Sign in again.');
    });
  });

  describe('profile', () => {
    it('returns the safe user shape', async () => {
      jest.mocked(findAuthUserById).mockResolvedValue(user);
      const result = await service.profile(user.id);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(user.id);
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      jest.mocked(findAuthUserById).mockResolvedValue(null);
      await expect(service.profile('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
