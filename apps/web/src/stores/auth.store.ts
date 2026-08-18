'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authClient, getApiBaseUrl, unwrap } from '@/lib/api/auth-client';
import { extractErrorMessage } from '@/lib/api/api-error';
import { buildLoginRedirect } from '@/lib/authorization/redirect';
import { toast } from '@/lib/toast';
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  avatarUrl: string | null;
  provider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
};
type Credentials = { email: string; password: string };
type Registration = Credentials & { firstName: string; lastName: string; confirmPassword: string };
type AuthorizationStatus = 'idle' | 'loading' | 'ready' | 'error';
type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  /** Live, DB-backed roles/permissions from `GET /auth/authorization` - see `fetchAuthorization`. */
  roles: string[];
  permissions: string[];
  isAdministrator: boolean;
  authzStatus: AuthorizationStatus;
  /** Whether the zustand `persist` middleware has finished rehydrating from localStorage on the client. */
  hasHydrated: boolean;
  /**
   * Whether the app-wide initial session check (`useAuthBootstrap`) has
   * settled - either the persisted store was already authenticated, or a
   * one-shot session-recovery `refresh()` attempt has finished, success or
   * failure. Shared store state (not a component-local ref) so the global
   * bootstrap hook and `AuthorizationGate` - separately mounted components
   * with no guaranteed effect ordering - can agree the check is done
   * without either duplicating the network call.
   */
  sessionChecked: boolean;
  login(input: Credentials): Promise<void>;
  register(input: Registration): Promise<string>;
  logout(): Promise<void>;
  refresh(): Promise<boolean>;
  fetchProfile(): Promise<void>;
  fetchAuthorization(): Promise<void>;
  clearError(): void;
  loginWithGoogle(): void;
  handleGoogleCallback(accessToken: string, refreshToken?: string | null): Promise<void>;
  logoutGoogle(): Promise<void>;
  setHasHydrated(value: boolean): void;
  setSessionChecked(value: boolean): void;
};
const message = (error: unknown) => extractErrorMessage(error, 'Authentication failed');
const unauthorized = {
  roles: [] as string[],
  permissions: [] as string[],
  isAdministrator: false,
  authzStatus: 'idle' as AuthorizationStatus,
};
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      authenticated: false,
      loading: false,
      error: null,
      roles: [],
      permissions: [],
      isAdministrator: false,
      authzStatus: 'idle',
      hasHydrated: false,
      sessionChecked: false,
      clearError: () => set({ error: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSessionChecked: (value) => set({ sessionChecked: value }),
      loginWithGoogle: () => {
        const base = getApiBaseUrl();
        window.location.assign(base ? `${base}/auth/google` : '/auth/google');
      },
      handleGoogleCallback: async (accessToken, refreshToken) => {
        set({ accessToken, authenticated: true, loading: true, error: null, authzStatus: 'idle' });
        if (typeof document !== 'undefined' && refreshToken) {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
          document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        }
        try {
          const user = unwrap<AuthUser>(await authClient.get('/auth/profile'));
          set({ user, authenticated: true, loading: false });
        } catch (error) {
          if (typeof document !== 'undefined') {
            document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Lax';
          }
          set({
            user: null,
            accessToken: null,
            authenticated: false,
            loading: false,
            error: message(error),
            ...unauthorized,
          });
          throw error;
        }
      },
      logoutGoogle: async () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Lax';
        }
        try {
          await authClient.post('/auth/logout');
        } finally {
          set({ user: null, accessToken: null, authenticated: false, ...unauthorized });
        }
      },
      login: async (input) => {
        set({ loading: true, error: null });
        try {
          const result = unwrap<{ user: AuthUser; accessToken: string }>(
            await authClient.post('/auth/login', input),
          );
          set({ ...result, authenticated: true, loading: false, authzStatus: 'idle' });
        } catch (error) {
          set({ error: message(error), loading: false });
          throw error;
        }
      },
      register: async (input) => {
        set({ loading: true, error: null });
        try {
          const result = unwrap<{ message: string }>(
            await authClient.post('/auth/register', input),
          );
          set({ loading: false });
          return result.message;
        } catch (error) {
          set({ error: message(error), loading: false });
          throw error;
        }
      },
      logout: async () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Lax';
        }
        try {
          await authClient.post('/auth/logout');
        } finally {
          set({ user: null, accessToken: null, authenticated: false, ...unauthorized });
        }
      },
      refresh: async () => {
        try {
          const result = unwrap<{ user: AuthUser; accessToken: string }>(
            await authClient.post('/auth/refresh', {}),
          );
          set({ ...result, authenticated: true, authzStatus: 'idle' });
          return true;
        } catch {
          set({ user: null, accessToken: null, authenticated: false, ...unauthorized });
          return false;
        }
      },
      fetchProfile: async () => {
        const user = unwrap<AuthUser>(await authClient.get('/auth/profile'));
        set({ user, authenticated: true });
      },
      fetchAuthorization: async () => {
        set({ authzStatus: 'loading' });
        try {
          const result = unwrap<{
            roles: string[];
            permissions: string[];
            isAdministrator: boolean;
          }>(await authClient.get('/auth/authorization'));
          set({ ...result, authzStatus: 'ready' });
        } catch {
          set({ authzStatus: 'error' });
        }
      },
    }),
    {
      name: 'joel-academy-auth',
      partialize: ({ user, accessToken, authenticated }) => ({ user, accessToken, authenticated }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
/**
 * `authClient` (from `@/lib/api/auth-client`) is a module-level singleton
 * that survives Fast Refresh of *this* file - but `interceptors.use(...)`
 * calls below are side effects, not exports, so HMR re-running this
 * module's top level would otherwise register a whole new set of
 * interceptors on top of the ones from every previous reload, each with
 * its own independent `refreshing` dedup variable unaware of the others.
 * A marker on the client itself (which does persist across this specific
 * reload) makes registration idempotent for the instance's lifetime.
 */
const INTERCEPTORS_REGISTERED = Symbol.for('joel-academy.auth-interceptors-registered');
type MarkedClient = typeof authClient & { [INTERCEPTORS_REGISTERED]?: boolean };
const markedClient = authClient as MarkedClient;

if (!markedClient[INTERCEPTORS_REGISTERED]) {
  markedClient[INTERCEPTORS_REGISTERED] = true;

  authClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  /**
   * Token-flow endpoints only - a 401 from one of these means the credential
   * itself was rejected (bad login, expired reset token, the refresh call
   * itself failing), so retrying after another refresh() doesn't make sense
   * and for `/auth/refresh` specifically would recurse. This must NOT match
   * `/auth/profile` or `/auth/authorization` - those are regular authenticated
   * "get my data" endpoints that happen to live under `/auth`, and a 401 from
   * either (e.g. an expired access token) should get the same refresh-and-retry
   * treatment as any other protected endpoint.
   */
  const AUTH_FLOW_PATHS = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/change-password',
    '/auth/google',
  ];
  const isAuthFlowRequest = (url?: string) =>
    Boolean(url) && AUTH_FLOW_PATHS.some((path) => url!.includes(path));

  let refreshing: Promise<boolean> | null = null;
  authClient.interceptors.response.use(undefined, async (error) => {
    const request = error.config as { _retry?: boolean; url?: string };
    const status = error.response?.status;
    if (status === 401 && !request._retry && !isAuthFlowRequest(request.url)) {
      request._retry = true;
      refreshing ??= useAuthStore
        .getState()
        .refresh()
        .finally(() => {
          refreshing = null;
        });
      const refreshed = await refreshing;
      if (refreshed) return authClient(error.config);
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const isProtectedRoute =
          pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
        if (isProtectedRoute) {
          window.location.assign(
            buildLoginRedirect(`${pathname}${window.location.search}`),
          );
        }
      }
    }
    if (status === 403 && !isAuthFlowRequest(request.url)) {
      toast.error('Access denied', "You don't have permission to do that.");
    }
    throw error;
  });
}
