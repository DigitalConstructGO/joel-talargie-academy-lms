'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '../api/telegram.api';
import { accountKeys } from '../api/query-keys';

export function useTelegramStatus() {
  return useQuery({
    queryKey: accountKeys.telegramStatus(),
    queryFn: () => telegramApi.getStatus(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      // Stop polling once Telegram account is connected
      if (query.state.data?.connected) {
        return false;
      }
      // Real-time polling every 2 seconds while unconnected
      return 2000;
    },
  });
}

export function useCreateTelegramLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => telegramApi.createLink(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.telegramStatus() });
    },
  });
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => telegramApi.unlink(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.telegramStatus() });
    },
  });
}
