import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  findAuthUserByEmail,
  recordLoginAttempt,
  upsertGoogleUser,
  createRefreshSession,
  rotateRefreshSession,
} from '@joel-academy/database';
import { AuthService } from '../auth.service';
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
  const service = new AuthService(
    database as never,
    passwords as never,
    jwt,
    config,
    audit as never,
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
      ...user,
      provider: 'GOOGLE',
      avatarUrl: 'https://example.com/avatar.png',
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
});
