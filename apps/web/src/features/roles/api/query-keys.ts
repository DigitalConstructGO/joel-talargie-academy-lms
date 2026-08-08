import type { RoleListParams } from '../types/role.types';

export const roleKeys = {
  all: ['admin-roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params: RoleListParams) => [...roleKeys.lists(), params] as const,
  detail: (roleId: string) => [...roleKeys.all, 'detail', roleId] as const,
};
