import { MOCK_ROLES } from '@/features/roles/data/mock-roles.data';
import { MOCK_USER_SUMMARIES, MOCK_USERS } from './mock-users.data';
import type {
  ManagedUser,
  ManagedUserDetail,
  ManagedUserStatus,
  UpdateManagedUserProfileInput,
  UserActivityEntry,
  UserActivityParams,
  UserListParams,
  UserListResult,
  UserRoleAssignment,
} from '../types/user.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

const store: ManagedUser[] = MOCK_USERS.map((user) => ({ ...user }));

function filterUsers(params: UserListParams) {
  return store.filter((user) => {
    if (!params.includeArchived && user.status === 'ARCHIVED') return false;
    if (params.status && user.status !== params.status) return false;
    if (params.role && !user.roles.includes(params.role)) return false;
    if (params.provider && user.provider !== params.provider) return false;
    if (params.emailVerified !== undefined && user.emailVerified !== params.emailVerified)
      return false;
    if (params.search) {
      const needle = params.search.toLowerCase();
      if (
        !user.email.toLowerCase().includes(needle) &&
        !user.fullName.toLowerCase().includes(needle)
      )
        return false;
    }
    return true;
  });
}

function transition(userId: string, status: ManagedUserStatus): ManagedUser {
  const user = store.find((entry) => entry.id === userId);
  if (!user) notFound('User not found');
  user.status = status;
  user.archivedAt = status === 'ARCHIVED' ? new Date().toISOString() : null;
  user.updatedAt = new Date().toISOString();
  return user;
}

export const mockUsersApi = {
  list: async (params: UserListParams = {}): Promise<UserListResult> => {
    const filtered = filterUsers(params);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: filtered.slice(start, start + pageSize), total: filtered.length });
  },

  detail: async (userId: string): Promise<ManagedUserDetail> => {
    const user = store.find((entry) => entry.id === userId);
    if (!user) notFound('User not found');
    const summary = MOCK_USER_SUMMARIES[userId] ?? {
      enrollmentCount: 0,
      activeEnrollmentCount: 0,
      completedEnrollmentCount: 0,
      paymentAttemptCount: 0,
      certificateCount: 0,
      activeSessionCount: 0,
    };
    return delay({ ...user, ...summary });
  },

  updateProfile: async (
    userId: string,
    input: UpdateManagedUserProfileInput,
  ): Promise<ManagedUser> => {
    const user = store.find((entry) => entry.id === userId);
    if (!user) notFound('User not found');
    if (input.fullName !== undefined) {
      const [firstName, ...rest] = input.fullName.trim().split(' ');
      user.firstName = firstName ?? '';
      user.lastName = rest.join(' ') || null;
      user.fullName = input.fullName.trim();
    }
    if (input.phone !== undefined) user.phone = input.phone || null;
    if (input.bio !== undefined) user.bio = input.bio || null;
    user.updatedAt = new Date().toISOString();
    return delay(user);
  },

  activate: async (userId: string): Promise<ManagedUser> => delay(transition(userId, 'ACTIVE')),
  suspend: async (userId: string, _reason: string): Promise<ManagedUser> =>
    delay(transition(userId, 'SUSPENDED')),
  archive: async (userId: string, _reason: string): Promise<ManagedUser> =>
    delay(transition(userId, 'ARCHIVED')),
  restore: async (userId: string): Promise<ManagedUser> => delay(transition(userId, 'ACTIVE')),

  triggerPasswordReset: async (_userId: string): Promise<{ sent: boolean }> =>
    delay({ sent: true }),

  activity: async (_userId: string, _params: UserActivityParams): Promise<UserActivityEntry[]> =>
    delay([]),

  listRoles: async (userId: string): Promise<UserRoleAssignment[]> => {
    const user = store.find((entry) => entry.id === userId);
    if (!user) notFound('User not found');
    return delay(
      user.roles.flatMap((code) => {
        const role = MOCK_ROLES.find((entry) => entry.code === code);
        return role
          ? [
              {
                id: role.id,
                code: role.code,
                name: role.name,
                isSystem: role.isSystem,
                assignedAt: user.createdAt,
              },
            ]
          : [];
      }),
    );
  },

  assignRole: async (userId: string, roleId: string): Promise<UserRoleAssignment> => {
    const user = store.find((entry) => entry.id === userId);
    if (!user) notFound('User not found');
    const role = MOCK_ROLES.find((entry) => entry.id === roleId);
    if (!role) notFound('Role not found');
    if (!user.roles.includes(role.code)) user.roles = [...user.roles, role.code];
    return delay({
      id: role.id,
      code: role.code,
      name: role.name,
      isSystem: role.isSystem,
      assignedAt: new Date().toISOString(),
    });
  },

  removeRole: async (userId: string, roleId: string): Promise<{ message: string }> => {
    const user = store.find((entry) => entry.id === userId);
    if (!user) notFound('User not found');
    const role = MOCK_ROLES.find((entry) => entry.id === roleId);
    if (!role) notFound('Role not found');
    user.roles = user.roles.filter((code) => code !== role.code);
    return delay({ message: 'Role removed' });
  },
};
