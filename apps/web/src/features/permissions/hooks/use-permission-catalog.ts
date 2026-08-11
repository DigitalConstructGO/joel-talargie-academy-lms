'use client';

import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '../api/permissions.api';

export function usePermissionCatalog(search?: string) {
  return useQuery({
    queryKey: ['permission-catalog', search ?? ''] as const,
    queryFn: () => permissionsApi.list(search),
  });
}
