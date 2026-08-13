'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCouponsApi } from '../api/admin-coupons.api';
import type {
  CouponListParams,
  CouponRedemptionListParams,
  CreateCouponInput,
  UpdateCouponInput,
} from '../types/admin-promotion.types';

const couponKeys = {
  all: ['admin-coupons'] as const,
  lists: () => [...couponKeys.all, 'list'] as const,
  list: (params: CouponListParams) => [...couponKeys.lists(), params] as const,
  detail: (couponId: string) => [...couponKeys.all, 'detail', couponId] as const,
  redemptions: (couponId: string, params: CouponRedemptionListParams) =>
    [...couponKeys.detail(couponId), 'redemptions', params] as const,
};

export function useAdminCoupons(params: CouponListParams = {}) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => adminCouponsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminCouponDetail(couponId: string, enabled = true) {
  return useQuery({
    queryKey: couponKeys.detail(couponId),
    queryFn: () => adminCouponsApi.detail(couponId),
    enabled: enabled && Boolean(couponId),
  });
}

export function useCouponRedemptions(couponId: string, params: CouponRedemptionListParams) {
  return useQuery({
    queryKey: couponKeys.redemptions(couponId, params),
    queryFn: () => adminCouponsApi.redemptions(couponId, params),
    enabled: Boolean(couponId),
    placeholderData: (previous) => previous,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCouponInput) => adminCouponsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ couponId, input }: { couponId: string; input: UpdateCouponInput }) =>
      adminCouponsApi.update(couponId, input),
    onSuccess: (_data, { couponId }) => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: couponKeys.detail(couponId) });
    },
  });
}

export function useArchiveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => adminCouponsApi.archive(couponId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
  });
}
