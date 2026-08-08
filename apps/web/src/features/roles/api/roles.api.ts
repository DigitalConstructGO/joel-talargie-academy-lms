import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockRolesApi } from '../data/mock-roles.api';
import type {
  CreateRoleInput,
  Role,
  RoleDetail,
  RoleListParams,
  RoleListResult,
  UpdateRoleInput,
} from '../types/role.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveRolesApi = {
  list: async (params: RoleListParams = {}) =>
    unwrap<RoleListResult>(await authClient.get('/admin/roles', { params: cleanParams(params) })),

  detail: async (roleId: string) =>
    unwrap<RoleDetail>(await authClient.get(`/admin/roles/${encodeURIComponent(roleId)}`)),

  create: async (input: CreateRoleInput) =>
    unwrap<RoleDetail>(await authClient.post('/admin/roles', input)),

  update: async (roleId: string, input: UpdateRoleInput) =>
    unwrap<Role>(await authClient.patch(`/admin/roles/${encodeURIComponent(roleId)}`, input)),

  replacePermissions: async (roleId: string, permissionIds: string[]) =>
    unwrap<RoleDetail>(
      await authClient.put(`/admin/roles/${encodeURIComponent(roleId)}/permissions`, {
        permissionIds,
      }),
    ),

  archive: async (roleId: string) =>
    unwrap<void>(await authClient.delete(`/admin/roles/${encodeURIComponent(roleId)}`)),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const rolesApi = CATALOG_DATA_SOURCE === 'live' ? liveRolesApi : mockRolesApi;
