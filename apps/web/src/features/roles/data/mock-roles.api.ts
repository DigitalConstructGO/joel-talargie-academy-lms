import { MOCK_PERMISSIONS } from '@/features/permissions/data/mock-permissions.data';
import { MOCK_ROLES } from './mock-roles.data';
import type {
  CreateRoleInput,
  Role,
  RoleDetail,
  RoleListParams,
  RoleListResult,
  UpdateRoleInput,
} from '../types/role.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

function forbidden(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 403 };
  throw error;
}

let store: RoleDetail[] = MOCK_ROLES.map((role) => ({
  ...role,
  permissions: [...role.permissions],
}));

function toSummary(role: RoleDetail): Role {
  const { permissions: _permissions, ...summary } = role;
  return summary;
}

export const mockRolesApi = {
  list: async (params: RoleListParams = {}): Promise<RoleListResult> => {
    const filtered = store.filter((role) => {
      if (!params.archived && role.archivedAt) return false;
      if (params.archived && !role.archivedAt) return false;
      if (params.isSystem !== undefined && role.isSystem !== params.isSystem) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (!role.name.toLowerCase().includes(needle) && !role.code.toLowerCase().includes(needle))
          return false;
      }
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({
      items: filtered.slice(start, start + pageSize).map(toSummary),
      total: filtered.length,
    });
  },

  detail: async (roleId: string): Promise<RoleDetail> => {
    const role = store.find((entry) => entry.id === roleId);
    if (!role) notFound('Role not found');
    return delay(role);
  },

  create: async (input: CreateRoleInput): Promise<RoleDetail> => {
    const permissions = MOCK_PERMISSIONS.filter((permission) =>
      input.permissionIds.includes(permission.id),
    );
    const role: RoleDetail = {
      id: `role-${Date.now()}`,
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      isSystem: false,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissionCount: permissions.length,
      userCount: 0,
      permissions,
    };
    store = [role, ...store];
    return delay(role);
  },

  update: async (roleId: string, input: UpdateRoleInput): Promise<RoleDetail> => {
    const role = store.find((entry) => entry.id === roleId);
    if (!role) notFound('Role not found');
    if (role.isSystem) forbidden('System roles cannot be modified');
    if (input.name !== undefined) role.name = input.name;
    if (input.description !== undefined) role.description = input.description;
    role.updatedAt = new Date().toISOString();
    return delay(role);
  },

  replacePermissions: async (roleId: string, permissionIds: string[]): Promise<RoleDetail> => {
    const role = store.find((entry) => entry.id === roleId);
    if (!role) notFound('Role not found');
    if (role.isSystem) forbidden('System roles cannot be modified');
    role.permissions = MOCK_PERMISSIONS.filter((permission) =>
      permissionIds.includes(permission.id),
    );
    role.permissionCount = role.permissions.length;
    role.updatedAt = new Date().toISOString();
    return delay(role);
  },

  archive: async (roleId: string): Promise<void> => {
    const role = store.find((entry) => entry.id === roleId);
    if (!role) notFound('Role not found');
    if (role.isSystem) forbidden('System roles cannot be modified');
    store = store.filter((entry) => entry.id !== roleId);
    return delay(undefined);
  },
};
