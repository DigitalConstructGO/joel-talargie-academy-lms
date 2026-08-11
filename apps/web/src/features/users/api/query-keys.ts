import type { UserActivityParams, UserListParams } from '../types/user.types';

export const userKeys = {
  all: ['admin-users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
  activity: (userId: string, params: UserActivityParams) =>
    [...userKeys.all, 'activity', userId, params] as const,
  roles: (userId: string) => [...userKeys.all, 'roles', userId] as const,
};
