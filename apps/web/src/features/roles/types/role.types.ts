import type { Permission } from '@/features/permissions/types/permission.types';

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  permissionCount: number;
  userCount: number;
}

export interface RoleDetail extends Role {
  permissions: Permission[];
}

export interface RoleListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isSystem?: boolean;
  archived?: boolean;
}

export interface RoleListResult {
  items: Role[];
  total: number;
}

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}
