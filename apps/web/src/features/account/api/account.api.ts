import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAccountApi } from '../data/mock-account.api';
import type {
  AccountProfile,
  AvatarUploadResult,
  NotificationPreferences,
  RevokeAllSessionsResult,
  Session,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from '../types/account.types';

/** Talks to the real backend's authenticated `/me/*` account-center endpoints. */
const liveAccountApi = {
  getProfile: async () => unwrap<AccountProfile>(await authClient.get('/me/profile')),

  updateProfile: async (input: UpdateProfileInput) =>
    unwrap<Omit<AccountProfile, 'notificationPreferences'>>(
      await authClient.patch('/me/profile', input),
    ),

  updatePreferences: async (input: UpdatePreferencesInput) =>
    unwrap<NotificationPreferences>(await authClient.patch('/me/notification-preferences', input)),

  getSessions: async () => unwrap<Session[]>(await authClient.get('/me/sessions')),

  revokeSession: async (sessionId: string) =>
    unwrap<{ message: string }>(
      await authClient.delete(`/me/sessions/${encodeURIComponent(sessionId)}`),
    ),

  revokeAllSessions: async (includeCurrentSession: boolean) =>
    unwrap<RevokeAllSessionsResult>(
      await authClient.delete('/me/sessions', { data: { includeCurrentSession } }),
    ),

  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.set('file', file);
    return unwrap<AvatarUploadResult>(
      await authClient.post('/storage/avatar', form, {
        headers: { 'Content-Type': undefined },
      }),
    );
  },

  deleteAvatar: async () => unwrap<{ message: string }>(await authClient.delete('/storage/avatar')),

  /** Returns `null` when the user has no avatar (404) - not an error state. */
  getAvatarBlob: async (userId: string): Promise<Blob | null> => {
    try {
      const response = await authClient.get(`/storage/avatar/${encodeURIComponent(userId)}`, {
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) return null;
      throw error;
    }
  },
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const accountApi = CATALOG_DATA_SOURCE === 'live' ? liveAccountApi : mockAccountApi;
