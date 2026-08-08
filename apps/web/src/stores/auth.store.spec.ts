import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './auth.store';
import { authClient } from '@/lib/api/auth-client';

vi.mock('@/lib/api/auth-client', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/api/auth-client')>('@/lib/api/auth-client');
  return {
    ...actual,
    authClient: {
      post: vi.fn(),
      get: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

const mockedPost = vi.mocked(authClient.post);
const mockedGet = vi.mocked(authClient.get);

const INITIAL_STATE = useAuthStore.getState();

const AUTH_USER = {
  id: 'user-1',
  email: 'student@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  roles: ['STUDENT'],
  avatarUrl: null,
  provider: 'LOCAL' as const,
  emailVerified: true,
};

function axiosError(status: number, message: string) {
  return { response: { status, data: { error: { message } } } };
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState(INITIAL_STATE, true);
  });

  describe('login', () => {
    it('authenticates and stores the user + access token on success', async () => {
      mockedPost.mockResolvedValueOnce({
        data: { data: { user: AUTH_USER, accessToken: 'token-123' } },
      });

      await useAuthStore.getState().login({ email: AUTH_USER.email, password: 'secret' });

      const state = useAuthStore.getState();
      expect(state.authenticated).toBe(true);
      expect(state.user).toEqual(AUTH_USER);
      expect(state.accessToken).toBe('token-123');
      expect(state.loading).toBe(false);
      expect(mockedPost).toHaveBeenCalledWith('/auth/login', {
        email: AUTH_USER.email,
        password: 'secret',
      });
    });

    it('surfaces the real backend error message and rethrows on failure', async () => {
      mockedPost.mockRejectedValueOnce(axiosError(401, 'Invalid email or password'));

      await expect(
        useAuthStore.getState().login({ email: AUTH_USER.email, password: 'wrong' }),
      ).rejects.toBeTruthy();

      const state = useAuthStore.getState();
      expect(state.authenticated).toBe(false);
      expect(state.error).toBe('Invalid email or password');
      expect(state.loading).toBe(false);
    });
  });

  describe('register', () => {
    it('does not authenticate the user - registration requires email verification first', async () => {
      mockedPost.mockResolvedValueOnce({
        data: { data: { message: 'Check your email to verify your account.' } },
      });

      const message = await useAuthStore.getState().register({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: AUTH_USER.email,
        password: 'Str0ng!Pass',
        confirmPassword: 'Str0ng!Pass',
      });

      expect(message).toBe('Check your email to verify your account.');
      expect(useAuthStore.getState().authenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears user, roles, permissions, and authentication state', async () => {
      useAuthStore.setState({
        user: AUTH_USER,
        accessToken: 'token-123',
        authenticated: true,
        roles: ['STUDENT'],
        permissions: ['enrollments.read'],
        isAdministrator: false,
        authzStatus: 'ready',
      });
      mockedPost.mockResolvedValueOnce({ data: {} });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.authenticated).toBe(false);
      expect(state.roles).toEqual([]);
      expect(state.permissions).toEqual([]);
      expect(state.isAdministrator).toBe(false);
    });

    it('still clears local state even if the backend logout call fails', async () => {
      useAuthStore.setState({ user: AUTH_USER, accessToken: 'token-123', authenticated: true });
      mockedPost.mockRejectedValueOnce(new Error('network down'));

      await expect(useAuthStore.getState().logout()).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.authenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('refresh', () => {
    it('re-authenticates with a new access token on success', async () => {
      mockedPost.mockResolvedValueOnce({
        data: { data: { user: AUTH_USER, accessToken: 'refreshed-token' } },
      });

      const refreshed = await useAuthStore.getState().refresh();

      expect(refreshed).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('refreshed-token');
      expect(useAuthStore.getState().authenticated).toBe(true);
    });

    it('clears authentication state and returns false when refresh fails', async () => {
      useAuthStore.setState({ user: AUTH_USER, accessToken: 'stale-token', authenticated: true });
      mockedPost.mockRejectedValueOnce(axiosError(401, 'Refresh token expired'));

      const refreshed = await useAuthStore.getState().refresh();

      expect(refreshed).toBe(false);
      const state = useAuthStore.getState();
      expect(state.authenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });
  });

  describe('fetchAuthorization', () => {
    it('populates roles/permissions and marks authzStatus ready', async () => {
      mockedGet.mockResolvedValueOnce({
        data: {
          data: {
            roles: ['ADMINISTRATOR'],
            permissions: ['courses.read', 'courses.update'],
            isAdministrator: true,
          },
        },
      });

      await useAuthStore.getState().fetchAuthorization();

      const state = useAuthStore.getState();
      expect(state.authzStatus).toBe('ready');
      expect(state.roles).toEqual(['ADMINISTRATOR']);
      expect(state.permissions).toEqual(['courses.read', 'courses.update']);
      expect(state.isAdministrator).toBe(true);
    });

    it('marks authzStatus as error without throwing when the request fails', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(500, 'Internal error'));

      await useAuthStore.getState().fetchAuthorization();

      expect(useAuthStore.getState().authzStatus).toBe('error');
    });
  });

  describe('handleGoogleCallback', () => {
    it('fetches the profile and authenticates using the OAuth-issued access token', async () => {
      mockedGet.mockResolvedValueOnce({ data: { data: AUTH_USER } });

      await useAuthStore.getState().handleGoogleCallback('google-access-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('google-access-token');
      expect(state.authenticated).toBe(true);
      expect(state.user).toEqual(AUTH_USER);
    });

    it('clears state and rethrows when the profile fetch fails', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(401, 'Invalid token'));

      await expect(useAuthStore.getState().handleGoogleCallback('bad-token')).rejects.toBeTruthy();

      const state = useAuthStore.getState();
      expect(state.authenticated).toBe(false);
      expect(state.accessToken).toBeNull();
    });
  });
});
