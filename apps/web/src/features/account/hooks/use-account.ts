'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { accountApi } from '../api/account.api';
import { accountKeys } from '../api/query-keys';
import type { UpdatePreferencesInput, UpdateProfileInput } from '../types/account.types';

export function useProfile() {
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: () => accountApi.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => accountApi.updateProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.profile() });
      void fetchProfile();
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => accountApi.updatePreferences(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.profile() });
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: accountKeys.sessions(),
    queryFn: () => accountApi.getSessions(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => accountApi.revokeSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.sessions() });
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (includeCurrentSession: boolean) =>
      accountApi.revokeAllSessions(includeCurrentSession),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.sessions() });
    },
  });
}
