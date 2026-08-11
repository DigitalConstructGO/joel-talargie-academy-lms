import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { MOCK_PERMISSIONS } from '../data/mock-permissions.data';
import type { PermissionCatalog } from '../types/permission.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function groupByModule(permissions: typeof MOCK_PERMISSIONS): PermissionCatalog {
  const modules = [...new Set(permissions.map((permission) => permission.module))];
  return {
    groups: modules.map((module) => ({
      module,
      permissions: permissions.filter((permission) => permission.module === module),
    })),
  };
}

const livePermissionsApi = {
  list: async (search?: string) =>
    unwrap<PermissionCatalog>(
      await authClient.get('/admin/permissions', { params: search ? { search } : undefined }),
    ),
};

const mockPermissionsApi = {
  list: async (search?: string) => {
    const filtered = search
      ? MOCK_PERMISSIONS.filter(
          (permission) =>
            permission.code.includes(search.toLowerCase()) ||
            permission.description?.toLowerCase().includes(search.toLowerCase()),
        )
      : MOCK_PERMISSIONS;
    return delay(groupByModule(filtered));
  },
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const permissionsApi =
  CATALOG_DATA_SOURCE === 'live' ? livePermissionsApi : mockPermissionsApi;
