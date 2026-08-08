'use client';

import { useAuthStore } from '@/stores/auth.store';
import { can, canAll, canAny } from '@/lib/authorization/permissions';

/** Central authorization entry point - prefer this over reading `permissions` off the store directly. */
export function usePermissions() {
  const permissions = useAuthStore((state) => state.permissions);
  const isAdministrator = useAuthStore((state) => state.isAdministrator);

  return {
    permissions,
    isAdministrator,
    can: (permission: string) => isAdministrator || can(permissions, permission),
    canAny: (required: string[]) => isAdministrator || canAny(permissions, required),
    canAll: (required: string[]) => isAdministrator || canAll(permissions, required),
  };
}
