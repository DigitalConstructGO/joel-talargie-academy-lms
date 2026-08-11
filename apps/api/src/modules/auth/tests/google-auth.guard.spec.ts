import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

describe('GoogleAuthGuard', () => {
  const config = { get: jest.fn() };
  let guard: GoogleAuthGuard;
  let superCanActivate: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new GoogleAuthGuard(config as never);
    superCanActivate = jest
      .spyOn(Object.getPrototypeOf(GoogleAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
  });

  afterEach(() => superCanActivate.mockRestore());

  function context(overrides: {
    request?: Record<string, unknown>;
    response?: Record<string, unknown>;
  }) {
    const request = {
      path: '/api/v1/auth/google',
      query: {},
      cookies: {},
      ...overrides.request,
    };
    const response = {
      clearCookie: jest.fn(),
      cookie: jest.fn(),
      ...overrides.response,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as never;
  }

  function configureCredentials() {
    config.get.mockImplementation((key: string) =>
      key === 'GOOGLE_CLIENT_ID' || key === 'GOOGLE_CLIENT_SECRET'
        ? 'configured'
        : false,
    );
  }

  it('throws ServiceUnavailableException when Google OAuth credentials are missing', () => {
    config.get.mockReturnValue('');
    expect(() => guard.canActivate(context({}))).toThrow(
      ServiceUnavailableException,
    );
  });

  it('sets a signed, httpOnly oauth-state cookie on the initial redirect', () => {
    configureCredentials();
    const response = { cookie: jest.fn() };
    guard.canActivate(
      context({ request: { path: '/api/v1/auth/google' }, response }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'google_oauth_state',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: 'none' }),
    );
  });

  it('rejects a callback whose state does not match the cookie (CSRF protection)', () => {
    configureCredentials();
    expect(() =>
      guard.canActivate(
        context({
          request: {
            path: '/api/v1/auth/google/callback',
            query: { state: 'attacker-supplied' },
            cookies: { google_oauth_state: 'expected' },
          },
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects a callback with no state cookie at all', () => {
    configureCredentials();
    expect(() =>
      guard.canActivate(
        context({
          request: {
            path: '/api/v1/auth/google/callback',
            query: { state: 'anything' },
            cookies: {},
          },
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('accepts a callback whose state matches and clears the cookie', () => {
    configureCredentials();
    const response = { clearCookie: jest.fn() };
    const result = guard.canActivate(
      context({
        request: {
          path: '/api/v1/auth/google/callback',
          query: { state: 'match' },
          cookies: { google_oauth_state: 'match' },
        },
        response,
      }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'google_oauth_state',
      expect.any(Object),
    );
    expect(superCanActivate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('exposes the requested scopes and forwards the generated oauth state', () => {
    const request = { oauthState: 'generated-state' };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
    expect(guard.getAuthenticateOptions(ctx)).toEqual({
      scope: ['openid', 'email', 'profile'],
      state: 'generated-state',
    });
  });
});
