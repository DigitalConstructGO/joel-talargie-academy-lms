import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  ManagedUser,
  ManagedUserDetail,
  UpdateManagedUserProfileInput,
  UserActivityEntry,
  UserActivityParams,
  UserListParams,
  UserListResult,
  UserRoleAssignment,
} from '../types/user.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

/** Talks to the real backend's admin user-management endpoints. */
export const usersApi = {
  list: async (params: UserListParams = {}) =>
    unwrap<UserListResult>(await authClient.get('/admin/users', { params: cleanParams(params) })),

  detail: async (userId: string) =>
    unwrap<ManagedUserDetail>(await authClient.get(`/admin/users/${encodeURIComponent(userId)}`)),

  updateProfile: async (userId: string, input: UpdateManagedUserProfileInput) =>
    unwrap<ManagedUser>(
      await authClient.patch(`/admin/users/${encodeURIComponent(userId)}/profile`, input),
    ),

  activate: async (userId: string) =>
    unwrap<ManagedUser>(
      await authClient.post(`/admin/users/${encodeURIComponent(userId)}/activate`),
    ),

  suspend: async (userId: string, reason: string) =>
    unwrap<ManagedUser>(
      await authClient.post(`/admin/users/${encodeURIComponent(userId)}/suspend`, { reason }),
    ),

  archive: async (userId: string, reason: string) =>
    unwrap<ManagedUser>(
      await authClient.delete(`/admin/users/${encodeURIComponent(userId)}`, { data: { reason } }),
    ),

  restore: async (userId: string) =>
    unwrap<ManagedUser>(
      await authClient.post(`/admin/users/${encodeURIComponent(userId)}/restore`),
    ),

  triggerPasswordReset: async (userId: string) =>
    unwrap<{ sent: boolean }>(
      await authClient.post(`/admin/users/${encodeURIComponent(userId)}/send-password-reset`),
    ),

  activity: async (userId: string, params: UserActivityParams = {}) =>
    unwrap<UserActivityEntry[]>(
      await authClient.get(`/admin/users/${encodeURIComponent(userId)}/activity`, {
        params: cleanParams(params),
      }),
    ),

  listRoles: async (userId: string) =>
    unwrap<UserRoleAssignment[]>(
      await authClient.get(`/admin/users/${encodeURIComponent(userId)}/roles`),
    ),

  assignRole: async (userId: string, roleId: string) =>
    unwrap<UserRoleAssignment>(
      await authClient.post(`/admin/users/${encodeURIComponent(userId)}/roles`, { roleId }),
    ),

  removeRole: async (userId: string, roleId: string) =>
    unwrap<{ message: string }>(
      await authClient.delete(
        `/admin/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
      ),
    ),
};
