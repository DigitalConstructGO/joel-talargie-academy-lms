'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi } from '../api/account.api';
import { accountKeys } from '../api/query-keys';

/**
 * The avatar stream endpoint (`GET /storage/avatar/:userId`) requires a
 * Bearer token, so it can't be used as a plain `<img src>` - fetch it as a
 * blob and wrap it in an object URL instead, revoking the previous one on
 * every change so we don't leak object URLs across uploads/deletes.
 */
export function useAvatarImage(userId: string | undefined) {
  const query = useQuery({
    queryKey: accountKeys.avatar(userId ?? ''),
    queryFn: () => accountApi.getAvatarBlob(userId!),
    enabled: Boolean(userId),
  });

  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);

  return { url, isLoading: query.isLoading };
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => accountApi.uploadAvatar(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => accountApi.deleteAvatar(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
