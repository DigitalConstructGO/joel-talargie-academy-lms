'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authClient, unwrap } from '@/lib/api/auth-client';
import { ROUTES } from '@/constants/routes';
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
  handleGoogleCallback(accessToken: string): Promise<void>;
  logoutGoogle(): Promise<void>;
  setHasHydrated(value: boolean): void;
  setSessionChecked(value: boolean): void;
};
const message = (error: unknown) => {
  if (typeof error === 'object' && error && 'response' in error) {
    const body = (
      error as { response?: { data?: { error?: { message?: string }; message?: string } } }
    ).response?.data;
    return body?.error?.message ?? body?.message ?? 'Authentication failed';
  }
  return 'Authentication failed';
};
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
        const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
        window.location.assign(`${base}/auth/google`);
      },
      handleGoogleCallback: async (accessToken) => {
        set({ accessToken, authenticated: true, loading: true, error: null, authzStatus: 'idle' });
        try {
          const user = unwrap<AuthUser>(await authClient.get('/auth/profile'));
          set({ user, authenticated: true, loading: false });
        } catch (error) {
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
authClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let refreshing: Promise<boolean> | null = null;
authClient.interceptors.response.use(undefined, async (error) => {
  const request = error.config as { _retry?: boolean; url?: string };
  const status = error.response?.status;
  if (status === 401 && !request._retry && !request.url?.includes('/auth/')) {
    request._retry = true;
    refreshing ??= useAuthStore
      .getState()
      .refresh()
      .finally(() => {
        refreshing = null;
      });
    const refreshed = await refreshing;
    if (refreshed) return authClient(error.config);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.assign(ROUTES.auth.login);
    }
  }
  if (status === 403 && !request.url?.includes('/auth/')) {
    toast.error('Access denied', "You don't have permission to do that.");
  }
  throw error;
});
