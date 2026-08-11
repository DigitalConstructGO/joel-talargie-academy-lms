import type { AuthenticationProvider } from '@/features/account/types/account.types';

export type ManagedUserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface ManagedUser {
  id: string;
  email: string;
  status: ManagedUserStatus;
  emailVerified: boolean;
  provider: AuthProvider;
  avatarUrl: string | null;
  archivedAt: string | null;
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
}

export interface ManagedUserSummary {
  enrollmentCount: number;
  activeEnrollmentCount: number;
  completedEnrollmentCount: number;
  paymentAttemptCount: number;
  certificateCount: number;
  activeSessionCount: number;
}

export type ManagedUserDetail = ManagedUser & ManagedUserSummary;

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ManagedUserStatus;
  role?: string;
  provider?: AuthProvider;
  emailVerified?: boolean;
  includeArchived?: boolean;
}

export interface UserListResult {
  items: ManagedUser[];
  total: number;
}

export interface UpdateManagedUserProfileInput {
  fullName?: string;
  phone?: string;
  bio?: string;
}

export interface UserActivityEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface UserActivityParams {
  action?: string;
  page?: number;
  pageSize?: number;
}

export interface UserRoleAssignment {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  assignedAt: string;
}
