export interface AuthenticationProvider {
  provider: string;
  providerEmail: string | null;
  linkedAt: string | null;
  lastLoginAt: string | null;
}

export interface NotificationPreferences {
  emailLearning: boolean;
  emailPayments: boolean;
  emailCertificates: boolean;
  inAppLearning: boolean;
  inAppPayments: boolean;
  inAppCertificates: boolean;
}

export interface AccountProfile {
  id: string;
  email: string;
  status: string;
  emailVerified: boolean;
  provider: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  fullName: string;
  roles: string[];
  authenticationProviders: AuthenticationProvider[];
  notificationPreferences: NotificationPreferences;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  bio?: string;
}

export type UpdatePreferencesInput = Partial<NotificationPreferences>;

export interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  deviceName: string;
  currentSession: boolean;
}

export interface RevokeAllSessionsResult {
  revokedSessions: number;
  logoutRequired: boolean;
}

export interface AvatarUploadResult {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  width: number;
  height: number;
  downloadUrl: string;
}
