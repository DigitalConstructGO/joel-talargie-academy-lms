'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { userKeys } from '../api/query-keys';
import type {
  UpdateManagedUserProfileInput,
  UserActivityParams,
  UserListParams,
} from '../types/user.types';

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersApi.detail(userId),
    enabled: Boolean(userId),
  });
}

export function useUserActivity(userId: string, params: UserActivityParams = {}) {
  return useQuery({
    queryKey: userKeys.activity(userId, params),
    queryFn: () => usersApi.activity(userId, params),
    enabled: Boolean(userId),
  });
}

function useUserMutation<TInput = void>(
  mutationFn: (userId: string, input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: TInput }) => mutationFn(userId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
    },
  });
}

export function useUpdateUserProfile() {
  return useUserMutation<UpdateManagedUserProfileInput>((userId, input) =>
    usersApi.updateProfile(userId, input),
  );
}

export function useActivateUser() {
  return useUserMutation<void>((userId) => usersApi.activate(userId));
}

export function useSuspendUser() {
  return useUserMutation<string>((userId, reason) => usersApi.suspend(userId, reason));
}

export function useArchiveUser() {
  return useUserMutation<string>((userId, reason) => usersApi.archive(userId, reason));
}

export function useRestoreUser() {
  return useUserMutation<void>((userId) => usersApi.restore(userId));
}

export function useTriggerPasswordReset() {
  return useUserMutation<void>((userId) => usersApi.triggerPasswordReset(userId));
}

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: userKeys.roles(userId),
    queryFn: () => usersApi.listRoles(userId),
    enabled: Boolean(userId),
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersApi.assignRole(userId, roleId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.roles(variables.userId) });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersApi.removeRole(userId, roleId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.roles(variables.userId) });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
    },
  });
}
