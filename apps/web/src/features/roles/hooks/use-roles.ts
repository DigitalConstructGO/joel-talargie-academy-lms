'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../api/roles.api';
import { roleKeys } from '../api/query-keys';
import type { CreateRoleInput, RoleListParams, UpdateRoleInput } from '../types/role.types';
import { useAuthStore } from '@/stores/auth.store';

export function useRoles(params: RoleListParams = {}) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => rolesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useRole(roleId: string) {
  return useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => rolesApi.detail(roleId),
    enabled: Boolean(roleId),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => rolesApi.create(input),
    onSuccess: (data) => {
      if (data) void queryClient.setQueryData(roleKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, input }: { roleId: string; input: UpdateRoleInput }) =>
      rolesApi.update(roleId, input),
    onSuccess: (data, variables) => {
      if (data) void queryClient.setQueryData(roleKeys.detail(variables.roleId), data);
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleId) });
    },
  });
}

export function useReplaceRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.replacePermissions(roleId, permissionIds),
    onSuccess: (data, variables) => {
      if (data) void queryClient.setQueryData(roleKeys.detail(variables.roleId), data);
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleId) });
      void useAuthStore.getState().fetchAuthorization();
    },
  });
}

export function useArchiveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => rolesApi.archive(roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}
