import { AuthController } from '../auth.controller';

describe('AuthController', () => {
  const auth = {
    register: jest.fn(),
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    profile: jest.fn(),
  };
  const config = { get: jest.fn(), getOrThrow: jest.fn() };
  const controller = new AuthController(auth as never, config as never);
  const user = { id: 'user-1', roles: ['STUDENT'] } as never;

  function response() {
    return {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('registers a new account by delegating to AuthService', () => {
    auth.register.mockResolvedValue({ user: { id: 'user-1' } });
    controller.register({ email: 'a@b.com' } as never);
    expect(auth.register).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('sets a secure httpOnly refresh cookie on login', async () => {
    auth.login.mockResolvedValue({
      user: { id: 'user-1' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const res = response();
    const request = { ip: '1.2.3.4', get: () => 'jest-agent' };
    const result = await controller.login(
      {} as never,
      request as never,
      res as never,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'none' }),
    );
    expect(result).toEqual({
      user: { id: 'user-1' },
      accessToken: 'access-token',
    });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('prefers a body-supplied refresh token over the cookie', async () => {
    auth.refresh.mockResolvedValue({
      user: { id: 'user-1' },
      accessToken: 'a',
      refreshToken: 'b',
    });
    const request = { cookies: { refresh_token: 'cookie-token' } };
    await controller.refresh(
      { token: 'body-token' },
      request as never,
      response() as never,
    );
    expect(auth.refresh).toHaveBeenCalledWith('body-token');
  });

  it('falls back to the cookie refresh token when the body omits one', async () => {
    auth.refresh.mockResolvedValue({
      user: { id: 'user-1' },
      accessToken: 'a',
      refreshToken: 'b',
    });
    const request = { cookies: { refresh_token: 'cookie-token' } };
    await controller.refresh({}, request as never, response() as never);
    expect(auth.refresh).toHaveBeenCalledWith('cookie-token');
  });

  it('clears the refresh cookie on logout', async () => {
    auth.logout.mockResolvedValue({ message: 'Logged out successfully' });
    const res = response();
    const request = { cookies: { refresh_token: 'token' } };
    await controller.logout(user, request as never, res as never);
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', {
      path: '/',
    });
    expect(auth.logout).toHaveBeenCalledWith('token', user);
  });

  it('delegates email verification, password reset, and profile lookups', () => {
    controller.verify({ token: 'a' } as never);
    expect(auth.verifyEmail).toHaveBeenCalledWith('a');

    controller.forgot({ email: 'a@b.com' } as never);
    expect(auth.forgotPassword).toHaveBeenCalledWith('a@b.com');

    controller.reset({ token: 'a' } as never);
    expect(auth.resetPassword).toHaveBeenCalledWith({ token: 'a' });

    controller.change(user, { currentPassword: 'x' } as never);
    expect(auth.changePassword).toHaveBeenCalledWith(user, {
      currentPassword: 'x',
    });

    controller.profile(user);
    expect(auth.profile).toHaveBeenCalledWith('user-1');
  });

  it('redirects to the web app with an access token fragment after a Google callback, and sets the refresh cookie', async () => {
    config.getOrThrow.mockReturnValue('http://localhost:3000');
    auth.loginWithGoogle.mockResolvedValue({
      user: { id: 'user-1' },
      accessToken: 'google-access-token',
      refreshToken: 'google-refresh-token',
    });
    const res = response();
    const request = {
      user: { googleId: 'g1', email: 'a@b.com' },
      ip: '1.2.3.4',
      get: () => 'jest-agent',
    };
    await controller.googleCallback(request as never, res as never);
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'google-refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('access_token=google-access-token'),
    );
  });
});
