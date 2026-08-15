'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import type { SettingsListParams, UpdateSettingsBatchInput } from '../types/settings.types';

const settingsKeys = {
  all: ['platform-settings'] as const,
  list: (params: SettingsListParams) => [...settingsKeys.all, 'list', params] as const,
  history: (key: string) => [...settingsKeys.all, 'history', key] as const,
  structured: () => [...settingsKeys.all, 'structured'] as const,
  publicLanding: () => ['public-landing'] as const,
};

export function useSettings(params: SettingsListParams = {}) {
  return useQuery({
    queryKey: settingsKeys.list(params),
    queryFn: () => settingsApi.list(params),
  });
}

export function useStructuredAcademySettings() {
  return useQuery({
    queryKey: settingsKeys.structured(),
    queryFn: () => settingsApi.getStructured(),
  });
}

export function usePublicLandingData() {
  return useQuery({
    queryKey: settingsKeys.publicLanding(),
    queryFn: () => settingsApi.getPublicLanding(),
  });
}

export function useSettingHistory(key: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.history(key ?? ''),
    queryFn: () => settingsApi.history(key!),
    enabled: Boolean(key),
  });
}

export function useUpdateSettingsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsBatchInput) => settingsApi.batch(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      void queryClient.invalidateQueries({ queryKey: settingsKeys.publicLanding() });
    },
  });
}
