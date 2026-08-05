import { MeController } from '../controllers/me.controller';

describe('MeController', () => {
  const users = {
    ownProfile: jest.fn(),
    updateProfile: jest.fn(),
    sessions: jest.fn(),
    revoke: jest.fn(),
    revokeAll: jest.fn(),
    profile: jest.fn(),
    preferences: jest.fn(),
    updatePreferences: jest.fn(),
  };
  const controller = new MeController(users as never);
  const user = {
    id: 'user-1',
    roles: ['STUDENT'],
    sessionId: 'session-1',
  } as never;

  function response() {
    return { clearCookie: jest.fn() };
  }

  beforeEach(() => jest.clearAllMocks());

  it('gets and updates the caller’s own profile', () => {
    controller.profile(user);
    expect(users.ownProfile).toHaveBeenCalledWith('user-1');
    controller.update(user, { firstName: 'A' } as never);
    expect(users.updateProfile).toHaveBeenCalledWith(user, 'user-1', {
      firstName: 'A',
    });
  });

  it('account is an alias for profile', () => {
    controller.account(user);
    expect(users.ownProfile).toHaveBeenCalledWith('user-1');
  });

  it('lists the caller’s own sessions', () => {
    controller.sessions(user);
    expect(users.sessions).toHaveBeenCalledWith('user-1', 'session-1');
  });

  it('clears the refresh cookie when revoking the current session', async () => {
    const res = response();
    await controller.revoke(user, 'session-1', res as never);
    expect(users.revoke).toHaveBeenCalledWith(user, 'user-1', 'session-1');
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', {
      path: '/',
    });
  });

  it('does not clear the cookie when revoking a different session', async () => {
    const res = response();
    await controller.revoke(user, 'other-session', res as never);
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('revokeAll keeps the current session by default and does not clear the cookie', async () => {
    users.revokeAll.mockResolvedValue(3);
    const res = response();
    const result = await controller.revokeAll(user, {} as never, res as never);
    expect(users.revokeAll).toHaveBeenCalledWith(user, 'user-1', 'session-1');
    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(result).toEqual({ revokedSessions: 3, logoutRequired: undefined });
  });

  it('revokeAll including the current session clears the cookie and reports logoutRequired', async () => {
    users.revokeAll.mockResolvedValue(5);
    const res = response();
    const result = await controller.revokeAll(
      user,
      { includeCurrentSession: true } as never,
      res as never,
    );
    expect(users.revokeAll).toHaveBeenCalledWith(user, 'user-1', undefined);
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', {
      path: '/',
    });
    expect(result).toEqual({ revokedSessions: 5, logoutRequired: true });
  });

  it('extracts authenticationProviders from the full profile', async () => {
    users.profile.mockResolvedValue({
      authenticationProviders: ['LOCAL', 'GOOGLE'],
    });
    const result = await controller.providers(user);
    expect(result).toEqual(['LOCAL', 'GOOGLE']);
  });

  it('gets and updates notification preferences', () => {
    controller.preferences(user);
    expect(users.preferences).toHaveBeenCalledWith('user-1');
    controller.updatePreferences(user, { emailSecurity: false } as never);
    expect(users.updatePreferences).toHaveBeenCalledWith('user-1', {
      emailSecurity: false,
    });
  });
});
