import { UnauthorizedException } from '@nestjs/common';
import { findAuthUserById } from '@joel-academy/database';
import { JwtStrategy } from '../strategies/jwt.strategy';

describe('JwtStrategy', () => {
  const config = { getOrThrow: jest.fn().mockReturnValue('a'.repeat(32)) };
  const database = { client: {} };
  const strategy = new JwtStrategy(config as never, database as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects a refresh-typed token presented as an access token', async () => {
    await expect(
      strategy.validate({ type: 'refresh', sub: 'user-1' } as never),
    ).rejects.toThrow(UnauthorizedException);
    expect(findAuthUserById).not.toHaveBeenCalled();
  });

  it('rejects when the user no longer exists', async () => {
    (findAuthUserById as jest.Mock).mockResolvedValue(undefined);
    await expect(
      strategy.validate({ type: 'access', sub: 'user-1' } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a suspended or archived user even with a structurally valid token', async () => {
    (findAuthUserById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      status: 'SUSPENDED',
    });
    await expect(
      strategy.validate({ type: 'access', sub: 'user-1' } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns a safe user shape for an active user, never leaking the password hash', async () => {
    (findAuthUserById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      roles: ['STUDENT'],
      avatarUrl: null,
      provider: 'LOCAL',
      emailVerified: true,
      status: 'ACTIVE',
      passwordHash: 'must-not-leak',
    });
    const result = await strategy.validate({
      type: 'access',
      sub: 'user-1',
      sid: 'session-1',
    } as never);
    expect(result).toEqual({
      id: 'user-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      roles: ['STUDENT'],
      avatarUrl: null,
      provider: 'LOCAL',
      emailVerified: true,
      sessionId: 'session-1',
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
