import { useAuthStore } from '@/stores';
import type {
  AccountProfile,
  AvatarUploadResult,
  RevokeAllSessionsResult,
  Session,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from '../types/account.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let profile: AccountProfile | null = null;

function ensureProfile(): AccountProfile {
  if (profile) return profile;
  const user = useAuthStore.getState().user;
  const now = new Date().toISOString();
  profile = {
    id: user?.id ?? 'mock-student',
    email: user?.email ?? 'student@example.com',
    status: 'ACTIVE',
    emailVerified: user?.emailVerified ?? true,
    provider: user?.provider ?? 'LOCAL',
    avatarUrl: user?.avatarUrl ?? null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    firstName: user?.firstName ?? 'Student',
    lastName: user?.lastName ?? '',
    phone: null,
    bio: null,
    fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Student',
    roles: user?.roles ?? ['STUDENT'],
    authenticationProviders: [
      {
        provider: user?.provider ?? 'LOCAL',
        providerEmail: user?.email ?? null,
        linkedAt: now,
        lastLoginAt: now,
      },
    ],
    notificationPreferences: {
      emailLearning: true,
      emailPayments: true,
      emailCertificates: true,
      inAppLearning: true,
      inAppPayments: true,
      inAppCertificates: true,
    },
  };
  return profile;
}

let sessions: Session[] = [
  {
    id: 'session-current',
    ipAddress: '196.188.**.***',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    lastUsedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 27).toISOString(),
    deviceName: 'Mozilla/5.0 (Windows',
    currentSession: true,
  },
  {
    id: 'session-mobile',
    ipAddress: '102.164.**.***',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
    deviceName: 'Mozilla/5.0 (iPhone;',
    currentSession: false,
  },
];

let avatarBlob: Blob | null = null;

export const mockAccountApi = {
  getProfile: async (): Promise<AccountProfile> => delay({ ...ensureProfile() }),

  updateProfile: async (input: UpdateProfileInput): Promise<AccountProfile> => {
    const current = ensureProfile();
    const names = input.fullName?.trim().split(/\s+/);
    profile = {
      ...current,
      firstName: names?.[0] ?? current.firstName,
      lastName: names ? names.slice(1).join(' ') : current.lastName,
      fullName: input.fullName?.trim() ?? current.fullName,
      phone: input.phone ?? current.phone,
      bio: input.bio ?? current.bio,
      updatedAt: new Date().toISOString(),
    };
    return delay({ ...profile });
  },

  updatePreferences: async (
    input: UpdatePreferencesInput,
  ): Promise<AccountProfile['notificationPreferences']> => {
    const current = ensureProfile();
    profile = {
      ...current,
      notificationPreferences: { ...current.notificationPreferences, ...input },
    };
    return delay({ ...profile.notificationPreferences });
  },

  getSessions: async (): Promise<Session[]> => delay(sessions.map((session) => ({ ...session }))),

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    sessions = sessions.filter((session) => session.id !== sessionId);
    return delay({ message: 'Session revoked' });
  },

  revokeAllSessions: async (includeCurrentSession: boolean): Promise<RevokeAllSessionsResult> => {
    const revoked = includeCurrentSession
      ? sessions.length
      : sessions.filter((session) => !session.currentSession).length;
    sessions = includeCurrentSession ? [] : sessions.filter((session) => session.currentSession);
    return delay({ revokedSessions: revoked, logoutRequired: includeCurrentSession });
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResult> => {
    avatarBlob = file;
    return delay({
      id: `avatar-${Date.now()}`,
      originalFileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      checksum: 'mock-checksum',
      width: 512,
      height: 512,
      downloadUrl: '/storage/avatar/mock-user',
    });
  },

  deleteAvatar: async (): Promise<{ message: string }> => {
    if (!avatarBlob) {
      const error = new Error('No avatar to delete') as Error & { response?: { status: number } };
      error.response = { status: 404 };
      throw error;
    }
    avatarBlob = null;
    return delay({ message: 'Avatar deleted' });
  },

  /** Returns `null` when the mock user has no avatar uploaded - not an error state. */
  getAvatarBlob: async (): Promise<Blob | null> => delay(avatarBlob),
};
