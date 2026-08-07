'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCouponsApi } from '../api/admin-coupons.api';
import type {
  CouponListParams,
  CreateCouponInput,
  GenerateCouponsInput,
  UpdateCouponInput,
} from '../types/admin-promotion.types';

const couponKeys = {
  all: ['admin-coupons'] as const,
  lists: () => [...couponKeys.all, 'list'] as const,
  list: (params: CouponListParams) => [...couponKeys.lists(), params] as const,
};

export function useAdminCoupons(params: CouponListParams = {}) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => adminCouponsApi.list(params),
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

export function useGenerateCoupons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateCouponsInput) => adminCouponsApi.generate(input),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
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
