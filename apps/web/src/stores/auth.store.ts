'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authClient, unwrap } from '@/lib/api/auth-client';
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
type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  login(input: Credentials): Promise<void>;
  register(input: Registration): Promise<string>;
  logout(): Promise<void>;
  refresh(): Promise<boolean>;
  fetchProfile(): Promise<void>;
  clearError(): void;
  loginWithGoogle(): void;
  handleGoogleCallback(accessToken: string): Promise<void>;
  logoutGoogle(): Promise<void>;
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
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      authenticated: false,
      loading: false,
      error: null,
      clearError: () => set({ error: null }),
      loginWithGoogle: () => {
        const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
        window.location.assign(`${base}/auth/google`);
      },
      handleGoogleCallback: async (accessToken) => {
        set({ accessToken, authenticated: true, loading: true, error: null });
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
          });
          throw error;
        }
      },
      logoutGoogle: async () => {
        try {
          await authClient.post('/auth/logout');
        } finally {
          set({ user: null, accessToken: null, authenticated: false });
        }
      },
      login: async (input) => {
        set({ loading: true, error: null });
        try {
          const result = unwrap<{ user: AuthUser; accessToken: string }>(
            await authClient.post('/auth/login', input),
          );
          set({ ...result, authenticated: true, loading: false });
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
          set({ user: null, accessToken: null, authenticated: false });
        }
      },
      refresh: async () => {
        try {
          const result = unwrap<{ user: AuthUser; accessToken: string }>(
            await authClient.post('/auth/refresh', {}),
          );
          set({ ...result, authenticated: true });
          return true;
        } catch {
          set({ user: null, accessToken: null, authenticated: false });
          return false;
        }
      },
      fetchProfile: async () => {
        const user = unwrap<AuthUser>(await authClient.get('/auth/profile'));
        set({ user, authenticated: true });
      },
    }),
    {
      name: 'joel-academy-auth',
      partialize: ({ user, accessToken, authenticated }) => ({ user, accessToken, authenticated }),
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
  if (error.response?.status === 401 && !request._retry && !request.url?.includes('/auth/')) {
    request._retry = true;
    refreshing ??= useAuthStore
      .getState()
      .refresh()
      .finally(() => {
        refreshing = null;
      });
    if (await refreshing) return authClient(error.config);
  }
  throw error;
});
