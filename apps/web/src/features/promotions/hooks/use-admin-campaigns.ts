'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCampaignsApi } from '../api/admin-campaigns.api';
import type {
  CampaignListParams,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../types/admin-promotion.types';

const campaignKeys = {
  all: ['admin-campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params: CampaignListParams) => [...campaignKeys.lists(), params] as const,
  detail: (campaignId: string) => [...campaignKeys.all, 'detail', campaignId] as const,
};

export function useAdminCampaigns(params: CampaignListParams = {}) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => adminCampaignsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminCampaign(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: () => adminCampaignsApi.detail(campaignId),
    enabled: Boolean(campaignId),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => adminCampaignsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, input }: { campaignId: string; input: UpdateCampaignInput }) =>
      adminCampaignsApi.update(campaignId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) });
    },
  });
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => adminCampaignsApi.archive(campaignId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}
